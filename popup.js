// QA & Input Validation Extension - popup.js

document.addEventListener("DOMContentLoaded", () => {
  const btnOpenOptions = document.getElementById("btnOpenOptions");
  const btnOpenGithub = document.getElementById("btnOpenGithub");
  const versionText = document.getElementById("versionText");

  // Display version
  const manifestData = chrome.runtime.getManifest();
  versionText.textContent = `v${manifestData.version}`;

  // Open Options Page
  btnOpenOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close(); // Close popup
  });

  // Open Github repository
  btnOpenGithub.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://github.com/Quake-py/Payload-Injector" });
    window.close();
  });
});
