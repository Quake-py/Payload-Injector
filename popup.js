// QA & Input Validation Extension - popup.js

document.addEventListener("DOMContentLoaded", () => {
  const btnOpenOptions = document.getElementById("btnOpenOptions");
  const btnOpenGithub = document.getElementById("btnOpenGithub");
  const popupSubtitle = document.getElementById("popupSubtitle");
  const versionText = document.getElementById("versionText");

  // Display version
  const manifestData = chrome.runtime.getManifest();
  versionText.textContent = `v${manifestData.version}`;

  // Read language and apply translations
  chrome.storage.local.get(["appLanguage"], (result) => {
    const lang = result.appLanguage || "en";
    if (lang === "tr") {
      popupSubtitle.textContent = "Açık Kaynak QA & Girdi Doğrulama Test Aracı";
      btnOpenOptions.textContent = "⚙️ Ayarlar Sayfası";
      btnOpenGithub.textContent = "🐙 GitHub Deposu";
    }
  });

  // Open Options Page
  btnOpenOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  // Open Github repository
  btnOpenGithub.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://github.com/Quake-py/Payload-Injector" });
    window.close();
  });
});
