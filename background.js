// QA & Input Validation Extension - background.js

const GITHUB_USERNAME = "Quake-py";
const OFFICIAL_REPO = "Payload-Injector";
const BRANCH = "master";

const OFFICIAL_VECTORS_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/vectors.json`;
const OFFICIAL_MANIFEST_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/manifest.json`;
const OFFICIAL_BACKGROUND_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/background.js`;
const OFFICIAL_CONTENT_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${OFFICIAL_REPO}/${BRANCH}/content.js`;

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.remove(["contentScriptCode", "backgroundScriptCode"]);
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
  
  chrome.storage.local.get(["payloads", "customPayloads", "appLanguage"], (result) => {
    const payloads = result.payloads || {};
    const customPayloads = result.customPayloads || {};
    const lang = result.appLanguage || "en";
    
    const activePayloadTree = payloads[lang] || payloads["en"] || {};
    
    // Separate generator subtree and official subtree
    const generatorKey = lang === "tr" ? "Rastgele Veri Üreticiler" : "Random Data Generators";
    const generatorsData = activePayloadTree[generatorKey] || {};
    
    // Search in separated generators tree first
    let value = findPayloadValue(generatorsData, info.menuItemId, "parent_generators");
    
    // If not found in generators, search in official payloads (excluding the generator key)
    if (value === null) {
      const officialCleanTree = JSON.parse(JSON.stringify(activePayloadTree));
      delete officialCleanTree[generatorKey];
      value = findPayloadValue(officialCleanTree, info.menuItemId, "parent_official");
    }
    
    // If still not found, search in custom user uploaded payloads
    if (value === null) {
      value = findPayloadValue(customPayloads, info.menuItemId, "parent_custom");
    }
    
    if (value !== null) {
      // Dynamic random data generation check
      if (value === "GEN_RANDOM_EMAIL") {
        value = `testuser_${Math.floor(Math.random() * 100000)}@example.com`;
      } else if (value === "GEN_RANDOM_PASSWORD") {
        value = generateRandomPassword();
      } else if (value === "GEN_RANDOM_USERNAME") {
        value = `user_${Math.floor(Math.random() * 100000)}`;
      } else if (value === "GEN_RANDOM_UUID") {
        value = self.crypto.randomUUID();
      } else if (value === "GEN_RANDOM_NUMBER") {
        value = Math.floor(100000 + Math.random() * 900000).toString();
      }

      chrome.tabs.sendMessage(tab.id, {
        action: "injectPayload",
        value: value
      }).catch(err => console.log("Tab communication error:", err));
    }
  });
});

// Helper for generating complex passwords
function generateRandomPassword() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let pass = "";
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

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
  const result = await chrome.storage.local.get(["payloads", "customPayloads", "appLanguage"]);
  if (!result.customPayloads) {
    await chrome.storage.local.set({ customPayloads: {} });
  }
  if (!result.appLanguage) {
    await chrome.storage.local.set({ appLanguage: "en" });
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

// Auto update from Github - Sadece vectors.json ve sürüm durumunu günceller
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
  
  const result = await chrome.storage.local.get(["payloads", "customPayloads", "appLanguage"]);
  const payloads = result.payloads || {};
  const customPayloads = result.customPayloads || {};
  const lang = result.appLanguage || "en";
  
  // Set menu titles based on language
  const generatorsTitle = lang === "tr" ? "Rastgele Veri Üreticiler" : "Random Data Generators";
  const officialTitle = lang === "tr" ? "Resmi Payloadlar" : "Official Payloads";
  const customTitle = lang === "tr" ? "Özel Payloadlar (Yüklenenler)" : "Custom Payloads (Uploaded)";
  const settingsTitle = lang === "tr" ? "⚙️ Ayarları Aç" : "⚙️ Open Settings";
  const githubTitle = lang === "tr" ? "🐙 GitHub Deposuna Git" : "🐙 Go to GitHub Repository";

  const activePayloadTree = payloads[lang] || payloads["en"] || {};
  const generatorKey = lang === "tr" ? "Rastgele Veri Üreticiler" : "Random Data Generators";
  
  // 1. Rastgele Veri Üreticiler Grubu (Üst Düzey / Ayrı Sekme)
  const generatorsData = activePayloadTree[generatorKey];
  if (generatorsData) {
    chrome.contextMenus.create({
      id: "parent_generators",
      title: generatorsTitle,
      contexts: ["editable"]
    });
    buildSubMenus(generatorsData, "parent_generators");
  }

  // 2. Resmi Payload'lar Grubu
  chrome.contextMenus.create({
    id: "parent_official",
    title: officialTitle,
    contexts: ["editable"]
  });
  
  // Resmi payload ağacından üreticileri çıkarıp geri kalanı ekle
  const officialCleanTree = JSON.parse(JSON.stringify(activePayloadTree));
  delete officialCleanTree[generatorKey];
  buildSubMenus(officialCleanTree, "parent_official");
  
  // 3. Özel (Custom) Payload'lar Grubu
  if (Object.keys(customPayloads).length > 0) {
    chrome.contextMenus.create({
      id: "parent_custom",
      title: customTitle,
      contexts: ["editable"]
    });
    buildSubMenus(customPayloads, "parent_custom");
  }

  // 4. Menü Ayırıcı Kısayollar
  chrome.contextMenus.create({
    id: "separator_line",
    type: "separator",
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: "action_open_settings",
    title: settingsTitle,
    contexts: ["editable"]
  });

  chrome.contextMenus.create({
    id: "action_open_github",
    title: githubTitle,
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
