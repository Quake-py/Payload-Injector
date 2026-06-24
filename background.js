// QA & Input Validation Extension - background.js

// Resmi GitHub Deposu Bilgileri
const OFFICIAL_REPO = "Payload-Injector";
const GITHUB_USERNAME = "Quake-py";
const OFFICIAL_VECTORS_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/master/vectors.json`;
const OFFICIAL_MANIFEST_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/master/manifest.json`;

chrome.runtime.onInstalled.addListener(async () => {
  await initializePayloads();
  await checkForUpdates();
});

chrome.runtime.onStartup.addListener(async () => {
  await rebuildMenus();
  await checkForUpdates();
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  
  chrome.storage.local.get(["payloads", "customPayloads"], (result) => {
    const payloads = result.payloads || {};
    const customPayloads = result.customPayloads || {};
    
    // Hem resmi hem de özel payload'lar içinde ara
    let value = findPayloadValue(payloads, info.menuItemId, "parent_official");
    if (value === null) {
      value = findPayloadValue(customPayloads, info.menuItemId, "parent_custom");
    }
    
    if (value !== null) {
      chrome.tabs.sendMessage(tab.id, {
        action: "injectPayload",
        value: value
      }).catch(err => console.log("Tab communication error:", err));
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "rebuildMenus") {
    rebuildMenus().then(() => {
      sendResponse({ status: "success" });
    });
    return true;
  } else if (message.action === "checkOfficialUpdate") {
    checkForUpdates().then((updateInfo) => {
      sendResponse(updateInfo);
    });
    return true;
  }
});

// Helper: Initialize payloads from vectors.json if not present
async function initializePayloads() {
  const result = await chrome.storage.local.get(["payloads", "customPayloads"]);
  if (!result.customPayloads) {
    await chrome.storage.local.set({ customPayloads: {} });
  }
  
  if (!result.payloads) {
    try {
      const response = await fetch(chrome.runtime.getURL("vectors.json"));
      const defaultPayloads = await response.json();
      await chrome.storage.local.set({ payloads: defaultPayloads });
    } catch (e) {
      console.error("Failed to load default vectors.json", e);
    }
  }
  await rebuildMenus();
}

// Auto update from Github
async function checkForUpdates() {
  try {
    // 1. Manifest / Versiyon Kontrolü
    const manifestRes = await fetch(OFFICIAL_MANIFEST_URL);
    if (!manifestRes.ok) {
      throw new Error(`Manifest fetch failed with status: ${manifestRes.status}`);
    }
    const remoteManifest = await manifestRes.json();
    const currentVersion = chrome.runtime.getManifest().version;
    
    let hasNewExtensionVersion = false;
    if (remoteManifest.version && remoteManifest.version !== currentVersion) {
      hasNewExtensionVersion = true;
      await chrome.storage.local.set({ 
        newVersionAvailable: remoteManifest.version,
        githubRepoUrl: `https://github.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}`
      });
    }

    // 2. Vectors Güncellemesi
    const vectorsRes = await fetch(OFFICIAL_VECTORS_URL);
    if (!vectorsRes.ok) {
      throw new Error(`Vectors fetch failed with status: ${vectorsRes.status}`);
    }
    const remoteVectors = await vectorsRes.json();
    if (remoteVectors && typeof remoteVectors === "object") {
      await chrome.storage.local.set({ 
        payloads: remoteVectors,
        lastUpdated: new Date().toLocaleString()
      });
      await rebuildMenus();
    }
    
    return { success: true, hasNewVersion: hasNewExtensionVersion, version: remoteManifest.version };
  } catch (e) {
    console.warn("Otomatik güncelleme denetimi atlandı (GitHub deposu henüz oluşturulmamış veya erişilemiyor olabilir):", e.message);
    return { success: false, error: e.message };
  }
}

// Helper: Rebuild context menus from storage
async function rebuildMenus() {
  await chrome.contextMenus.removeAll();
  
  const result = await chrome.storage.local.get(["payloads", "customPayloads"]);
  const payloads = result.payloads || {};
  const customPayloads = result.customPayloads || {};
  
  // 1. Resmi Payload'lar Grubu
  chrome.contextMenus.create({
    id: "parent_official",
    title: "Official Payloads",
    contexts: ["editable"]
  });
  buildSubMenus(payloads, "parent_official");
  
  // 2. Özel (Custom) Payload'lar Grubu (TXT ile eklenenler)
  if (Object.keys(customPayloads).length > 0) {
    chrome.contextMenus.create({
      id: "parent_custom",
      title: "Custom Payloads (Yüklenenler)",
      contexts: ["editable"]
    });
    buildSubMenus(customPayloads, "parent_custom");
  }
}

// Helper: Recursively build nested submenus
function buildSubMenus(node, parentId) {
  if (typeof node !== "object" || node === null) return;
  
  Object.keys(node).forEach((key) => {
    const child = node[key];
    const menuId = `${parentId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    
    if (typeof child === "string") {
      chrome.contextMenus.create({
        id: menuId,
        parentId: parentId,
        title: key.length > 30 ? key.substring(0, 27) + "..." : key,
        contexts: ["editable"]
      });
    } else if (typeof child === "object" && child !== null) {
      chrome.contextMenus.create({
        id: menuId,
        parentId: parentId,
        title: key,
        contexts: ["editable"]
      });
      buildSubMenus(child, menuId);
    }
  });
}

// Helper: Recursively locate a payload string given its unique generated menu ID
function findPayloadValue(node, targetMenuId, parentId) {
  if (typeof node !== "object" || node === null) return null;
  
  const keys = Object.keys(node);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const child = node[key];
    const currentMenuId = `${parentId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    
    if (currentMenuId === targetMenuId) {
      if (typeof child === "string") {
        return child;
      }
    }
    
    if (typeof child === "object" && child !== null) {
      const found = findPayloadValue(child, targetMenuId, currentMenuId);
      if (found !== null) return found;
    }
  }
  return null;
}
