// QA & Input Validation Extension - options.js

// Bilingual UI translation map
const translations = {
  en: {
    subtitleHeader: "Open Source QA & Input Validation Testing Tool",
    txtLanguageTitle: "🌐 Language Settings",
    lblAppLanguage: "Select Extension Language",
    txtUpdatesTitle: "🔄 Official Updates Status",
    txtUpdatesDesc: "The extension automatically pulls latest payloads and release version details from the official GitHub master repository.",
    btnCheckUpdate: "Check for Updates Now",
    updateStatusActive: "Official Release Active",
    updateStatusChecking: "Checking for updates...",
    updateStatusSuccess: "Update checks successful!",
    updateStatusFailed: "Checks failed. Check connectivity.",
    txtCustomTitle: "📂 Import Custom Payloads (New Tab)",
    lblCustomCategory: "Category / Tab Title",
    customCategoryPlaceholder: "e.g. My SQLi Vectors",
    lblTxtFile: "Select TXT File (One Payload Per Line)",
    btnUploadTxt: "Upload TXT Payloads",
    btnClearCustom: "Clear All Custom Payloads",
    txtCustomManageTitle: "⚙️ Manage Custom Payload Categories",
    txtCustomManageDesc: "Review your uploaded payload tabs and delete them individually.",
    btnDeleteCategory: "Delete Category",
    confirmDeleteCategory: 'Are you sure you want to delete category "{cat}" and all its payloads?',
    confirmClearCustom: "Are you sure you want to delete all custom categories?",
    txtInspectTitle: "🔍 Inspect Loaded Payloads",
    searchBarPlaceholder: "Search by category name, title or payload value...",
    thSource: "Source",
    thCategory: "Category",
    thTitle: "Title / Row",
    thValue: "Payload Value",
    sourceOfficial: "Official",
    sourceCustom: "Custom",
    txtNewVersionAlertTitle: "New Code Update (HTML/JS) Available!",
    txtNewVersionAlertDesc: "You need to pull and refresh the updated code package to apply static UI/script enhancements.",
    btnDownloadUpdate: "Download Update (.ZIP)",
    alertTxtEmpty: "Please enter a category name and choose a .txt file first.",
    alertTxtNoLines: "Selected file is empty or invalid.",
    alertTxtSuccess: 'Successfully loaded {count} payloads into category "{cat}"!'
  },
  tr: {
    subtitleHeader: "Açık Kaynak QA & Girdi Doğrulama Test Aracı",
    txtLanguageTitle: "🌐 Dil Ayarları",
    lblAppLanguage: "Eklenti Dilini Seçin",
    txtUpdatesTitle: "🔄 Resmi Güncelleme Durumu",
    txtUpdatesDesc: "Eklenti resmi GitHub sunucumuz üzerinden manifest ve vectors.json dosyalarını otomatik olarak takip eder ve günceller.",
    btnCheckUpdate: "Güncellemeleri Şimdi Denetle",
    updateStatusActive: "Resmi Sürüm Aktif",
    updateStatusChecking: "Denetleniyor...",
    updateStatusSuccess: "Güncelleme başarılı!",
    updateStatusFailed: "Denetleme başarısız. Bağlantıyı denetleyin.",
    txtCustomTitle: "📂 Özel TXT Payload Ekle (Yeni Sekme)",
    lblCustomCategory: "Kategori / Sekme Adı",
    customCategoryPlaceholder: "Örn: Benim SQLi Payloadlarım",
    lblTxtFile: "TXT Dosyası Seç (Her Satıra Bir Payload)",
    btnUploadTxt: "TXT Payloadları Yükle",
    btnClearCustom: "Tüm Özel Payloadları Temizle",
    txtCustomManageTitle: "⚙️ Özel Payload Kategorilerini Yönet",
    txtCustomManageDesc: "Yüklediğiniz kategorileri/sekmeleri aşağıdaki listeden tek tek silebilirsiniz.",
    btnDeleteCategory: "Kategoriyi Sil",
    confirmDeleteCategory: '"{cat}" kategorisini ve altındaki tüm payloadları silmek istediğinizden emin misiniz?',
    confirmClearCustom: "Yüklediğiniz tüm özel payload kategorilerini temizlemek istediğinize emin misiniz?",
    txtInspectTitle: "🔍 Yüklü Payloadları İncele",
    searchBarPlaceholder: "Kategori veya payload içeriğinde ara...",
    thSource: "Kaynak",
    thCategory: "Kategori",
    thTitle: "Başlık / Satır",
    thValue: "Payload Değeri",
    sourceOfficial: "Resmi (Official)",
    sourceCustom: "Özel (Custom)",
    txtNewVersionAlertTitle: "Yeni Kod Güncellemesi (HTML/JS) Mevcut!",
    txtNewVersionAlertDesc: "Eklentinin HTML ve arayüz dosyalarında yapılan güncellemelerin etkinleşmesi için güncel kodları indirmeniz gerekir.",
    btnDownloadUpdate: "Güncellemesini İndir (.ZIP)",
    alertTxtEmpty: "Lütfen önce kategori / sekme adı girin ve bir .txt dosyası seçin.",
    alertTxtNoLines: "Seçilen TXT dosyası boş veya geçersiz satırlara sahip.",
    alertTxtSuccess: '"{cat}" kategorisine {count} adet payload başarıyla yüklendi!'
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const extVersionEl = document.getElementById("extVersion");
  const newVersionAlert = document.getElementById("newVersionAlert");
  const btnDownloadUpdate = document.getElementById("btnDownloadUpdate");
  const btnCheckUpdate = document.getElementById("btnCheckUpdate");
  const updateStatus = document.getElementById("updateStatus");
  const appLanguageSelect = document.getElementById("appLanguage");
  
  const customCategoryInput = document.getElementById("customCategory");
  const txtFileInput = document.getElementById("txtFile");
  const btnUploadTxt = document.getElementById("btnUploadTxt");
  const btnClearCustom = document.getElementById("btnClearCustom");

  const customCategoriesCard = document.getElementById("customCategoriesCard");
  const customCategoriesList = document.getElementById("customCategoriesList");

  const searchBar = document.getElementById("searchBar");
  const payloadTableBody = document.querySelector("#payloadTable tbody");
  
  let officialPayloads = {};
  let customPayloads = {};
  let currentLang = "en";

  // Set current version in UI
  const manifestData = chrome.runtime.getManifest();
  extVersionEl.textContent = `v${manifestData.version}`;

  // Apply language strings dynamically
  function translateUI(lang) {
    currentLang = lang;
    appLanguageSelect.value = lang;
    const t = translations[lang] || translations["en"];

    document.getElementById("subtitleHeader").textContent = t.subtitleHeader;
    document.getElementById("txtLanguageTitle").textContent = t.txtLanguageTitle;
    document.getElementById("lblAppLanguage").textContent = t.lblAppLanguage;
    document.getElementById("txtUpdatesTitle").textContent = t.txtUpdatesTitle;
    document.getElementById("txtUpdatesDesc").textContent = t.txtUpdatesDesc;
    btnCheckUpdate.textContent = t.btnCheckUpdate;

    document.getElementById("txtCustomTitle").textContent = t.txtCustomTitle;
    document.getElementById("lblCustomCategory").textContent = t.lblCustomCategory;
    customCategoryInput.placeholder = t.customCategoryPlaceholder;
    document.getElementById("lblTxtFile").textContent = t.lblTxtFile;
    btnUploadTxt.textContent = t.btnUploadTxt;
    btnClearCustom.textContent = t.btnClearCustom;

    document.getElementById("txtCustomManageTitle").textContent = t.txtCustomManageTitle;
    document.getElementById("txtCustomManageDesc").textContent = t.txtCustomManageDesc;
    document.getElementById("txtInspectTitle").textContent = t.txtInspectTitle;
    searchBar.placeholder = t.searchBarPlaceholder;

    document.getElementById("thSource").textContent = t.thSource;
    document.getElementById("thCategory").textContent = t.thCategory;
    document.getElementById("thTitle").textContent = t.thTitle;
    document.getElementById("thValue").textContent = t.thValue;

    document.getElementById("txtNewVersionAlertTitle").textContent = t.txtNewVersionAlertTitle;
    document.getElementById("txtNewVersionAlertDesc").textContent = t.txtNewVersionAlertDesc;
    btnDownloadUpdate.textContent = t.btnDownloadUpdate;

    // Render stats badge
    chrome.storage.local.get(["lastUpdated"], (res) => {
      if (res.lastUpdated) {
        updateStatus.textContent = `${lang === "tr" ? "Son Güncelleme" : "Last Update"}: ${res.lastUpdated}`;
        updateStatus.className = "status-badge status-success";
      } else {
        updateStatus.textContent = t.updateStatusActive;
        updateStatus.className = "status-badge status-info";
      }
    });
  }

  // Load configuration and payloads from storage
  function loadAndRender() {
    chrome.storage.local.get(["payloads", "customPayloads", "lastUpdated", "newVersionAvailable", "appLanguage"], (result) => {
      const lang = result.appLanguage || "en";
      translateUI(lang);

      officialPayloads = result.payloads || {};
      customPayloads = result.customPayloads || {};

      // New extension version alert banner
      if (result.newVersionAvailable) {
        newVersionAlert.style.display = "flex";
      } else {
        newVersionAlert.style.display = "none";
      }

      renderCustomCategoriesManager();
      renderPayloadTable();
    });
  }

  loadAndRender();

  // Language selection change handler
  appLanguageSelect.addEventListener("change", () => {
    const selectedLang = appLanguageSelect.value;
    chrome.storage.local.set({ appLanguage: selectedLang }, () => {
      translateUI(selectedLang);
      chrome.runtime.sendMessage({ action: "rebuildMenus" }, () => {
        loadAndRender();
      });
    });
  });

  // Manual update checker trigger
  btnCheckUpdate.addEventListener("click", () => {
    const t = translations[currentLang] || translations["en"];
    showStatus(t.updateStatusChecking, "status-info");
    
    chrome.runtime.sendMessage({ action: "checkOfficialUpdate" }, (response) => {
      if (response && response.success) {
        showStatus(t.updateStatusSuccess, "status-success");
        loadAndRender();
      } else {
        showStatus(t.updateStatusFailed, "status-error");
      }
    });
  });

  // Upload custom txt lists
  btnUploadTxt.addEventListener("click", () => {
    const t = translations[currentLang] || translations["en"];
    const categoryName = customCategoryInput.value.trim();
    const file = txtFileInput.files[0];

    if (!categoryName || !file) {
      alert(t.alertTxtEmpty);
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

      if (lines.length === 0) {
        alert(t.alertTxtNoLines);
        return;
      }

      const categoryObject = {};
      lines.forEach((line, index) => {
        categoryObject[`Line ${index + 1}`] = line;
      });

      chrome.storage.local.get(["customPayloads"], (result) => {
        const currentCustom = result.customPayloads || {};
        currentCustom[categoryName] = categoryObject;

        chrome.storage.local.set({ customPayloads: currentCustom }, () => {
          customCategoryInput.value = "";
          txtFileInput.value = "";
          
          const successMsg = t.alertTxtSuccess.replace("{count}", lines.length).replace("{cat}", categoryName);
          alert(successMsg);
          
          chrome.runtime.sendMessage({ action: "rebuildMenus" }, () => {
            loadAndRender();
          });
        });
      });
    };

    reader.readAsText(file);
  });

  // Clear all custom payloads
  btnClearCustom.addEventListener("click", () => {
    const t = translations[currentLang] || translations["en"];
    if (confirm(t.confirmClearCustom)) {
      chrome.storage.local.set({ customPayloads: {} }, () => {
        chrome.runtime.sendMessage({ action: "rebuildMenus" }, () => {
          loadAndRender();
        });
      });
    }
  });

  // Render categories and deletion list
  function renderCustomCategoriesManager() {
    const t = translations[currentLang] || translations["en"];
    const keys = Object.keys(customPayloads);
    if (keys.length === 0) {
      customCategoriesCard.style.display = "none";
      return;
    }

    customCategoriesCard.style.display = "block";
    customCategoriesList.innerHTML = "";

    keys.forEach((categoryName) => {
      const payloadCount = Object.keys(customPayloads[categoryName]).length;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "10px 14px";
      row.style.backgroundColor = "var(--bg-primary)";
      row.style.border = "1px solid var(--border-color)";
      row.style.borderRadius = "8px";

      const infoText = document.createElement("div");
      infoText.innerHTML = `<strong>${categoryName}</strong> <span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">(${payloadCount} Payloads)</span>`;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = t.btnDeleteCategory;
      deleteBtn.className = "btn";
      deleteBtn.style.padding = "6px 12px";
      deleteBtn.style.fontSize = "12px";
      deleteBtn.style.backgroundColor = "var(--danger)";

      deleteBtn.addEventListener("click", () => {
        const confirmMsg = t.confirmDeleteCategory.replace("{cat}", categoryName);
        if (confirm(confirmMsg)) {
          delete customPayloads[categoryName];
          chrome.storage.local.set({ customPayloads: customPayloads }, () => {
            chrome.runtime.sendMessage({ action: "rebuildMenus" }, () => {
              loadAndRender();
            });
          });
        }
      });

      row.appendChild(infoText);
      row.appendChild(deleteBtn);
      customCategoriesList.appendChild(row);
    });
  }

  // Live filter/search matching
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase().trim();
    filterTable(query);
  });

  // Render Table values
  function renderPayloadTable() {
    payloadTableBody.innerHTML = "";
    const t = translations[currentLang] || translations["en"];
    
    // Sadece secili dildeki resmi payload'lari tabloya cizdir
    const currentLangOfficial = officialPayloads[currentLang] || officialPayloads["en"] || {};
    traverseAndAdd(currentLangOfficial, t.sourceOfficial);
    
    // Kendi yukledigi ozel payload'lari ekle
    traverseAndAdd(customPayloads, t.sourceCustom);
  }

  function traverseAndAdd(node, sourceName) {
    function traverse(currentNode, path = []) {
      if (typeof currentNode !== "object" || currentNode === null) return;
      
      Object.keys(currentNode).forEach((key) => {
        const value = currentNode[key];
        if (typeof value === "string") {
          const row = document.createElement("tr");
          
          const cellSource = document.createElement("td");
          cellSource.textContent = sourceName;
          
          const cellCategory = document.createElement("td");
          cellCategory.textContent = path.join(" > ") || "General";
          
          const cellName = document.createElement("td");
          cellName.textContent = key;
          
          const cellValue = document.createElement("td");
          const codeEl = document.createElement("code");
          codeEl.textContent = value;
          cellValue.appendChild(codeEl);
          
          row.appendChild(cellSource);
          row.appendChild(cellCategory);
          row.appendChild(cellName);
          row.appendChild(cellValue);
          
          payloadTableBody.appendChild(row);
        } else if (typeof value === "object" && value !== null) {
          traverse(value, [...path, key]);
        }
      });
    }
    traverse(node);
  }

  function filterTable(query) {
    const rows = payloadTableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      const textContent = row.textContent.toLowerCase();
      if (textContent.includes(query)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  function showStatus(text, typeClass) {
    updateStatus.textContent = text;
    updateStatus.className = `status-badge ${typeClass}`;
  }
});
