// QA & Input Validation Extension - options.js

document.addEventListener("DOMContentLoaded", () => {
  const extVersionEl = document.getElementById("extVersion");
  const newVersionAlert = document.getElementById("newVersionAlert");
  const btnDownloadUpdate = document.getElementById("btnDownloadUpdate");
  const btnCheckUpdate = document.getElementById("btnCheckUpdate");
  const updateStatus = document.getElementById("updateStatus");
  
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

  // Set current version in UI
  const manifestData = chrome.runtime.getManifest();
  extVersionEl.textContent = `v${manifestData.version}`;

  // Load configuration and payloads from storage
  function loadAndRender() {
    chrome.storage.local.get(["payloads", "customPayloads", "lastUpdated", "newVersionAvailable", "githubRepoUrl"], (result) => {
      officialPayloads = result.payloads || {};
      customPayloads = result.customPayloads || {};
      
      // Update check indicator
      if (result.lastUpdated) {
        updateStatus.textContent = `Son Güncelleme: ${result.lastUpdated}`;
        updateStatus.className = "status-badge status-success";
      }

      // New extension version alert
      if (result.newVersionAvailable) {
        newVersionAlert.style.display = "flex";
        btnDownloadUpdate.href = "https://github.com/Quake-py/Payload-Injector/archive/refs/heads/master.zip";
        btnDownloadUpdate.textContent = `v${result.newVersionAvailable} Güncellemesini İndir (.ZIP)`;
      } else {
        newVersionAlert.style.display = "none";
      }

      // Render custom categories manager list
      renderCustomCategoriesManager();

      renderPayloadTable();
    });
  }

  // Render uploaded categories and single deletion buttons
  function renderCustomCategoriesManager() {
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
      infoText.innerHTML = `<strong>${categoryName}</strong> <span style="color: var(--text-muted); font-size: 12px; margin-left: 8px;">(${payloadCount} Payload)</span>`;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Kategoriyi Sil";
      deleteBtn.className = "btn";
      deleteBtn.style.padding = "6px 12px";
      deleteBtn.style.fontSize = "12px";
      deleteBtn.style.backgroundColor = "var(--danger)";

      deleteBtn.addEventListener("click", () => {
        if (confirm(`"${categoryName}" kategorisini ve altındaki tüm payloadları silmek istediğinizden emin misiniz?`)) {
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

  loadAndRender();

  // Manual update denetimi
  btnCheckUpdate.addEventListener("click", () => {
    showStatus("Denetleniyor...", "status-info");
    
    chrome.runtime.sendMessage({ action: "checkOfficialUpdate" }, (response) => {
      if (response && response.success) {
        showStatus("Güncelleme başarılı!", "status-success");
        loadAndRender();
      } else {
        showStatus("Denetleme başarısız oldu. Bağlantınızı kontrol edin.", "status-error");
      }
    });
  });

  // TXT Yükleme Mantığı
  btnUploadTxt.addEventListener("click", () => {
    const categoryName = customCategoryInput.value.trim();
    const file = txtFileInput.files[0];

    if (!categoryName) {
      alert("Lütfen önce kategori / sekme adı girin.");
      return;
    }
    if (!file) {
      alert("Lütfen bir .txt dosyası seçin.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      // Satırlara ayır ve temizle
      const lines = text.split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

      if (lines.length === 0) {
        alert("Seçilen TXT dosyası boş veya geçersiz satırlara sahip.");
        return;
      }

      // Kategori nesnesini oluştur
      const categoryObject = {};
      lines.forEach((line, index) => {
        categoryObject[`Line ${index + 1}`] = line;
      });

      // customPayloads'a ekle
      chrome.storage.local.get(["customPayloads"], (result) => {
        const currentCustom = result.customPayloads || {};
        currentCustom[categoryName] = categoryObject;

        chrome.storage.local.set({ customPayloads: currentCustom }, () => {
          customCategoryInput.value = "";
          txtFileInput.value = "";
          alert(`"${categoryName}" kategorisine ${lines.length} adet payload başarıyla yüklendi!`);
          
          // Rebuild context menus
          chrome.runtime.sendMessage({ action: "rebuildMenus" }, () => {
            loadAndRender();
          });
        });
      });
    };

    reader.readAsText(file);
  });

  // Özel Payloadları Temizleme
  btnClearCustom.addEventListener("click", () => {
    if (confirm("Yüklediğiniz tüm özel payload kategorilerini temizlemek istediğinize emin misiniz?")) {
      chrome.storage.local.set({ customPayloads: {} }, () => {
        chrome.runtime.sendMessage({ action: "rebuildMenus" }, () => {
          loadAndRender();
        });
      });
    }
  });

  // Arama/Filtreleme
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase().trim();
    filterTable(query);
  });

  // Tablo Çizimi (Hem Resmi hem Özel Payload'ları gösterir)
  function renderPayloadTable() {
    payloadTableBody.innerHTML = "";
    
    // Resmi olanları ekle
    traverseAndAdd(officialPayloads, "Resmi (Official)");
    // Özel olanları ekle
    traverseAndAdd(customPayloads, "Özel (Custom)");
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
          cellCategory.textContent = path.join(" > ") || "Genel";
          
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
