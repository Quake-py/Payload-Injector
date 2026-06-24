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
        btnDownloadUpdate.href = result.githubRepoUrl || "#";
        btnDownloadUpdate.textContent = `v${result.newVersionAvailable} Sürümüne Git`;
      } else {
        newVersionAlert.style.display = "none";
      }

      renderPayloadTable();
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
