// QA & Input Validation Extension - background.js

const GITHUB_USERNAME = "Quake-py";
const OFFICIAL_REPO = "Payload-Injector";
const BRANCH = "master";

const OFFICIAL_VECTORS_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/vectors.json`;
const OFFICIAL_MANIFEST_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/manifest.json`;
const OFFICIAL_BACKGROUND_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/background.js`;
const OFFICIAL_CONTENT_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/content.js`;

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
  if (info.menuItemId === "action_open_settings") {
    chrome.runtime.openOptionsPage();
    return;
  }
  if (info.menuItemId === "action_open_github") {
    chrome.tabs.create({ url: `https://github.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}` });
    return;
  }

  if (!tab || !tab.id) return;
  
  chrome.storage.local.get(["payloads", "customPayloads"], (result) => {
    const payloads = result.payloads || {};
    const customPayloads = result.customPayloads || {};
    
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

// Auto update from Github - Hem vectors.json hem de eklenti scriptlerini günceller!
async function checkForUpdates() {
  try {
    const cacheBuster = `?t=${Date.now()}`;

    // 1. Manifest / Versiyon Kontrolü
    const manifestRes = await fetch(OFFICIAL_MANIFEST_URL + cacheBuster);
    if (!manifestRes.ok) throw new Error("Manifest fetch failed");
    const remoteManifest = await manifestRes.json();
    const currentVersion = chrome.runtime.getManifest().version;
    
    let hasNewExtensionVersion = false;
    if (remoteManifest.version && remoteManifest.version !== currentVersion) {
      hasNewExtensionVersion = true;
      await chrome.storage.local.set({ 
        newVersionAvailable: remoteManifest.version,
        githubRepoUrl: `https://github.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}`
      });
    } else {
      await chrome.storage.local.remove(["newVersionAvailable"]);
    }

    // 2. Vectors/Payloads Güncellemesi
    const vectorsRes = await fetch(OFFICIAL_VECTORS_URL + cacheBuster);
    if (vectorsRes.ok) {
      const remoteVectors = await vectorsRes.json();
      if (remoteVectors && typeof remoteVectors === "object") {
        await chrome.storage.local.set({ payloads: remoteVectors });
      }
    }

    // 3. Kod/Script Güncellemelerini İndir ve Storage'a Yaz (Dinamik Enjeksiyon İçin)
    const contentScriptRes = await fetch(OFFICIAL_CONTENT_URL + cacheBuster);
    if (contentScriptRes.ok) {
      const latestContentCode = await contentScriptRes.text();
      await chrome.storage.local.set({ contentScriptCode: latestContentCode });
    }

    const backgroundScriptRes = await fetch(OFFICIAL_BACKGROUND_URL + cacheBuster);
    if (backgroundScriptRes.ok) {
      const latestBgCode = await backgroundScriptRes.text();
      await chrome.storage.local.set({ backgroundScriptCode: latestBgCode });
    }

    await chrome.storage.local.set({ lastUpdated: new Date().toLocaleString() });
    await rebuildMenus();
    
    return { success: true, hasNewVersion: hasNewExtensionVersion, version: remoteManifest.version };
  } catch (e) {
    console.warn("Otomatik güncelleme denetimi atlandı:", e.message);
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
  
  // 2. Özel (Custom) Payload'lar Grubu
  if (Object.keys(customPayloads).length > 0) {
    chrome.contextMenus.create({
      id: "parent_custom",
      title: "Custom Payloads (Yüklenenler)",
      contexts: ["editable"]
    });
    buildSubMenus(customPayloads, "parent_custom");
  }

  // 3. Menü Ayırıcı Kısayollar
  chrome.contextMenus.create({
    id: "separator_line",
    type: "separator",
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: "action_open_settings",
    title: "⚙️ Ayarları Aç",
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: "action_open_github",
    title: "🐙 GitHub Deposuna Git",
    contexts: ["editable"]
  });
}

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
