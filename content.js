// QA & Input Validation Extension - content.js

let activeElement = null;
let quickOverlayRoot = null;

// En son sağ tıklanan elementi yakala (Shadow DOM ve iframe içlerini destekleyecek şekilde)
document.addEventListener("contextmenu", (event) => {
  activeElement = getDeepActiveElement(event.target);
  updateOverlayTargetIndicator(activeElement);
}, true);

// Odaklanan elementi takip et
document.addEventListener("focus", (event) => {
  const deepActive = getDeepActiveElement(event.target);
  if (deepActive && (deepActive.tagName === "INPUT" || deepActive.tagName === "TEXTAREA" || deepActive.isContentEditable)) {
    activeElement = deepActive;
    updateOverlayTargetIndicator(deepActive);
  }
}, true);

document.addEventListener("click", (event) => {
  const deepActive = getDeepActiveElement(event.target);
  if (deepActive && (deepActive.tagName === "INPUT" || deepActive.tagName === "TEXTAREA" || deepActive.isContentEditable)) {
    activeElement = deepActive;
    updateOverlayTargetIndicator(deepActive);
  }
}, true);

// Arka plandan gelen enjeksiyon mesajlarını dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectPayload") {
    const valueToInject = message.value;
    const target = activeElement || getDeepActiveElement(document.activeElement);
    
    if (target) {
      if (message.preview) {
        showPreviewModal(target, valueToInject);
      } else {
        injectValueEnhanced(target, valueToInject);
      }
    }
  } else if (message.action === "openQuickOverlay") {
    const target = activeElement || getDeepActiveElement(document.activeElement);
    showQuickAccessOverlay(target);
  }
});

// Shadow DOM altındaki elementleri de bulabilmek için derinlik tarayıcı
function getDeepActiveElement(element) {
  if (!element) return null;
  if (element.shadowRoot && element.shadowRoot.activeElement) {
    return getDeepActiveElement(element.shadowRoot.activeElement);
  }
  return element;
}

// Gelişmiş Enjeksiyon Ön İzleme & Düzenleme Modalı
function showPreviewModal(targetElement, initialValue) {
  // Eski modal varsa temizle
  const oldModal = document.getElementById("payload-injector-modal-root");
  if (oldModal) oldModal.remove();

  chrome.storage.local.get(["appLanguage"], (result) => {
    const lang = result.appLanguage || "en";
    const textTitle = lang === "tr" ? "Payload'ı Enjekte Etmeden Önce Düzenle" : "Edit Payload Before Injection";
    const textInject = lang === "tr" ? "Yapıştır / Enjekte Et" : "Paste / Inject";
    const textCancel = lang === "tr" ? "İptal" : "Cancel";

    const modalRoot = document.createElement("div");
    modalRoot.id = "payload-injector-modal-root";
    modalRoot.style.position = "fixed";
    modalRoot.style.zIndex = "2147483647";
    modalRoot.style.top = "0";
    modalRoot.style.left = "0";

    const shadow = modalRoot.attachShadow({ mode: "open" });

    // CSS Reset & UI Styling
    const style = document.createElement("style");
    style.textContent = `
      .overlay {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .modal-box {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 20px;
        width: 90%; max-width: 480px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        color: #f8fafc;
        box-sizing: border-box;
      }
      .header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 14px;
      }
      .title { font-weight: 700; font-size: 15px; margin: 0; color: #3b82f6; }
      .close-btn { cursor: pointer; font-size: 18px; color: #94a3b8; transition: color 0.2s; }
      .close-btn:hover { color: #f8fafc; }
      .textarea {
        width: 100%; height: 120px;
        background: #0f172a; border: 1px solid #334155; border-radius: 8px;
        color: #f8fafc; padding: 10px; font-family: monospace; font-size: 13px;
        box-sizing: border-box; resize: vertical; margin-bottom: 16px;
      }
      .textarea:focus { outline: none; border-color: #3b82f6; }
      .actions { display: flex; justify-content: flex-end; gap: 8px; }
      .btn {
        padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none;
        transition: background-color 0.2s;
      }
      .btn-inject { background: #3b82f6; color: white; }
      .btn-inject:hover { background: #2563eb; }
      .btn-cancel { background: transparent; border: 1px solid #334155; color: #f8fafc; }
      .btn-cancel:hover { background: #334155; }
    `;

    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const modalBox = document.createElement("div");
    modalBox.className = "modal-box";

    const header = document.createElement("div");
    header.className = "header";

    const title = document.createElement("h3");
    title.className = "title";
    title.textContent = textTitle;

    const closeBtn = document.createElement("span");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;";

    const textarea = document.createElement("textarea");
    textarea.className = "textarea";
    textarea.value = initialValue;

    const actions = document.createElement("div");
    actions.className = "actions";

    const btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-cancel";
    btnCancel.textContent = textCancel;

    const btnInject = document.createElement("button");
    btnInject.className = "btn btn-inject";
    btnInject.textContent = textInject;

    // Build DOM
    header.appendChild(title);
    header.appendChild(closeBtn);
    actions.appendChild(btnCancel);
    actions.appendChild(btnInject);
    modalBox.appendChild(header);
    modalBox.appendChild(textarea);
    modalBox.appendChild(actions);
    overlay.appendChild(modalBox);
    shadow.appendChild(style);
    shadow.appendChild(overlay);

    document.body.appendChild(modalRoot);

    // Focus on Textarea automatically
    setTimeout(() => textarea.focus(), 50);

    // Close Actions
    const closeModal = () => modalRoot.remove();

    closeBtn.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);
    
    // Inject Action
    btnInject.addEventListener("click", () => {
      injectValueEnhanced(targetElement, textarea.value);
      closeModal();
    });

    // Shortcut: Ctrl+Enter or Cmd+Enter to inject, Escape to cancel
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        injectValueEnhanced(targetElement, textarea.value);
        closeModal();
      } else if (e.key === "Escape") {
        closeModal();
      }
    });
  });
}

// Gelişmiş Enjeksiyon Motoru
function injectValueEnhanced(element, value) {
  element.focus();

  // 1. AŞAMA: Pano / Yapıştırma (Clipboard Paste) Simülasyonu
  try {
    const pasteData = new DataTransfer();
    pasteData.setData("text/plain", value);
    const pasteEvent = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: pasteData
    });
    element.dispatchEvent(pasteEvent);
  } catch (e) {
    console.warn("Clipboard simülasyonu başarısız oldu:", e);
  }

  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    // 2. AŞAMA: React / Vue Dahili Setter Atlatma (Value Tracker Bypass)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    const nativeSetter = element.tagName === "INPUT" ? nativeInputValueSetter : nativeTextAreaValueSetter;

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const originalValue = element.value;
    const newValue = originalValue.slice(0, start) + value + originalValue.slice(end);

    if (nativeSetter) {
      try {
        nativeSetter.call(element, newValue);
      } catch (e) {
        element.value = newValue;
      }
    } else {
      element.value = newValue;
    }

    try {
      element.selectionStart = element.selectionEnd = start + value.length;
    } catch (e) {}

    // 3. AŞAMA: Karakter Karakter Klavye Tuş Vuruşu Gönderme
    simulateKeyboardTyping(element, value);

  } else if (element.isContentEditable) {
    // Zengin Metin Alanları (Rich Text)
    try {
      document.execCommand("insertText", false, value);
    } catch (e) {
      // Fallback
      const selection = window.getSelection();
      if (selection.rangeCount) {
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(value));
      } else {
        element.innerText = value;
      }
    }
    triggerBasicEvents(element);
  }
}

// Karakter bazlı klavye simülasyonu
function simulateKeyboardTyping(element, text) {
  // Önce standart input olayını tetikle
  triggerBasicEvents(element);

  // Her karakter için klavye olaylarını tetikleyerek tarayıcıyı inandır
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);

    const keyEvents = ["keydown", "keypress", "keyup"];
    keyEvents.forEach(eventName => {
      try {
        const keyEvent = new KeyboardEvent(eventName, {
          bubbles: true,
          cancelable: true,
          key: char,
          char: char,
          keyCode: charCode,
          which: charCode
        });
        element.dispatchEvent(keyEvent);
      } catch (e) {}
    });
  }

  // React'in sanal DOM durumunu güncellemesi için kanca
  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue(element.value);
  }
}

// Temel Olay Tetikleyicileri
function triggerBasicEvents(element) {
  const events = ["input", "change", "blur"];
  events.forEach(eventName => {
    const event = new Event(eventName, { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  });
}

function updateOverlayTargetIndicator(target) {
  if (!quickOverlayRoot) return;
  const shadow = quickOverlayRoot.shadowRoot;
  if (!shadow) return;
  const infoEl = shadow.getElementById("target-info");
  if (!infoEl) return;
  if (target) {
    const name = target.id ? `#${target.id}` : (target.name ? `[name="${target.name}"]` : target.tagName.toLowerCase());
    infoEl.textContent = `${name}`;
    infoEl.style.color = "#3b82f6";
  } else {
    infoEl.textContent = "None selected. Click/focus input.";
    infoEl.style.color = "#ef4444";
  }
}

// 4. AŞAMA: Kolay Erişim Menüsü (Quick Access Menu Overlay)
function showQuickAccessOverlay(initialTarget) {
  if (quickOverlayRoot) {
    quickOverlayRoot.remove();
  }

  chrome.storage.local.get(["payloads", "customPayloads", "appLanguage", "enablePreviewEdit"], (result) => {
    const payloads = result.payloads || {};
    const customPayloads = result.customPayloads || {};
    const lang = result.appLanguage || "en";
    const enablePreview = result.enablePreviewEdit || false;

    // Translations
    const textTitle = lang === "tr" ? "⚡ Kolay Erişim Menüsü" : "⚡ Quick Access Menu";
    const searchPlaceholder = lang === "tr" ? "Payload ara..." : "Search payloads...";
    const tabOfficial = lang === "tr" ? "Resmi" : "Official";
    const tabCustom = lang === "tr" ? "Özel" : "Custom";
    const tabGenerators = lang === "tr" ? "Üreticiler" : "Generators";
    const targetText = lang === "tr" ? "Hedef:" : "Target:";
    
    const activePayloadTree = payloads[lang] || payloads["en"] || {};
    const generatorKey = lang === "tr" ? "Rastgele Veri Üreticiler" : "Random Data Generators";
    const generatorsData = activePayloadTree[generatorKey] || {};

    const officialCleanTree = JSON.parse(JSON.stringify(activePayloadTree));
    delete officialCleanTree[generatorKey];

    // Create Root Container
    quickOverlayRoot = document.createElement("div");
    quickOverlayRoot.id = "payload-quick-overlay-root";
    quickOverlayRoot.style.position = "fixed";
    quickOverlayRoot.style.zIndex = "2147483647";
    quickOverlayRoot.style.top = "20px";
    quickOverlayRoot.style.right = "20px";
    
    const shadow = quickOverlayRoot.attachShadow({ mode: "open" });

    // Overlay CSS Styling
    const style = document.createElement("style");
    style.textContent = `
      .overlay-card {
        width: 320px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        color: #f8fafc;
        font-family: 'Inter', -apple-system, sans-serif;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .header {
        background: #0f172a;
        padding: 10px 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #334155;
        cursor: move;
      }
      .title {
        font-size: 13px;
        font-weight: 700;
        margin: 0;
        background: linear-gradient(135deg, #60a5fa, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .close-btn {
        cursor: pointer;
        font-size: 18px;
        color: #94a3b8;
        line-height: 1;
      }
      .close-btn:hover {
        color: #f8fafc;
      }
      .target-panel {
        padding: 6px 12px;
        background: #0f172a;
        border-bottom: 1px solid #334155;
        font-size: 11px;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .search-container {
        padding: 10px;
        background: #1e293b;
        border-bottom: 1px solid #334155;
      }
      .search-input {
        width: 100%;
        padding: 8px 10px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 6px;
        color: #f8fafc;
        font-size: 12px;
        box-sizing: border-box;
        outline: none;
      }
      .search-input:focus {
        border-color: #3b82f6;
      }
      .tabs {
        display: flex;
        background: #0f172a;
        border-bottom: 1px solid #334155;
      }
      .tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        color: #94a3b8;
        padding: 8px 0;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: color 0.2s, border-bottom 0.2s;
        border-bottom: 2px solid transparent;
      }
      .tab-btn:hover {
        color: #f8fafc;
      }
      .tab-btn.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
      }
      .list-content {
        height: 220px;
        overflow-y: auto;
        padding: 8px;
        box-sizing: border-box;
      }
      .list-content::-webkit-scrollbar {
        width: 6px;
      }
      .list-content::-webkit-scrollbar-track {
        background: transparent;
      }
      .list-content::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 4px;
      }
      .category-header {
        font-size: 10px;
        font-weight: 700;
        color: #3b82f6;
        text-transform: uppercase;
        margin: 8px 4px 4px 4px;
        letter-spacing: 0.5px;
      }
      .payload-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        margin-bottom: 4px;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .payload-item:hover {
        background: #334155;
        border-color: #3b82f6;
      }
      .payload-label {
        font-size: 11px;
        font-weight: 500;
        color: #e2e8f0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 260px;
      }
    `;

    // Elements Builder
    const card = document.createElement("div");
    card.className = "overlay-card";

    const header = document.createElement("div");
    header.className = "header";

    const title = document.createElement("h4");
    title.className = "title";
    title.textContent = textTitle;

    const closeBtn = document.createElement("span");
    closeBtn.className = "close-btn";
    closeBtn.innerHTML = "&times;";

    const targetPanel = document.createElement("div");
    targetPanel.className = "target-panel";
    targetPanel.innerHTML = `<span>${targetText}</span><span id="target-info" style="font-weight:600;"></span>`;

    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "search-input";
    searchInput.placeholder = searchPlaceholder;

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs";

    const tabBtnOfficial = document.createElement("button");
    tabBtnOfficial.className = "tab-btn active";
    tabBtnOfficial.textContent = tabOfficial;

    const tabBtnCustom = document.createElement("button");
    tabBtnCustom.className = "tab-btn";
    tabBtnCustom.textContent = tabCustom;

    const tabBtnGenerators = document.createElement("button");
    tabBtnGenerators.className = "tab-btn";
    tabBtnGenerators.textContent = tabGenerators;

    const listContent = document.createElement("div");
    listContent.className = "list-content";

    // Append to Hierarchy
    header.appendChild(title);
    header.appendChild(closeBtn);
    searchContainer.appendChild(searchInput);
    tabsContainer.appendChild(tabBtnOfficial);
    tabsContainer.appendChild(tabBtnCustom);
    tabsContainer.appendChild(tabBtnGenerators);

    card.appendChild(header);
    card.appendChild(targetPanel);
    card.appendChild(searchContainer);
    card.appendChild(tabsContainer);
    card.appendChild(listContent);
    shadow.appendChild(style);
    shadow.appendChild(card);

    document.body.appendChild(quickOverlayRoot);

    // Initial state target setup
    updateOverlayTargetIndicator(activeElement || initialTarget);

    let activeTabName = "official"; // official, custom, generators

    // Load Tab Payloads List
    function renderList(searchQuery = "") {
      listContent.innerHTML = "";
      const query = searchQuery.toLowerCase().trim();

      if (activeTabName === "official") {
        renderTree(officialCleanTree, query);
      } else if (activeTabName === "custom") {
        renderTree(customPayloads, query);
      } else if (activeTabName === "generators") {
        renderTree(generatorsData, query);
      }
    }

    function renderTree(node, query) {
      if (typeof node !== "object" || node === null) return;

      Object.keys(node).forEach(key => {
        const child = node[key];
        if (typeof child === "string") {
          // Leaf node / Payload Item
          const matchesQuery = key.toLowerCase().includes(query) || child.toLowerCase().includes(query);
          if (matchesQuery) {
            const item = document.createElement("div");
            item.className = "payload-item";
            
            const label = document.createElement("span");
            label.className = "payload-label";
            label.textContent = key;
            label.title = `${key} : ${child}`;

            item.appendChild(label);
            
            item.addEventListener("click", () => {
              const currentTarget = activeElement || getDeepActiveElement(document.activeElement);
              if (currentTarget) {
                // Check generator keywords
                let resolvedValue = child;
                if (child === "GEN_RANDOM_EMAIL") {
                  resolvedValue = `testuser_${Math.floor(Math.random() * 100000)}@example.com`;
                } else if (child === "GEN_RANDOM_PASSWORD") {
                  resolvedValue = generateRandomPassword();
                } else if (child === "GEN_RANDOM_USERNAME") {
                  resolvedValue = `user_${Math.floor(Math.random() * 100000)}`;
                } else if (child === "GEN_RANDOM_UUID") {
                  resolvedValue = self.crypto.randomUUID();
                } else if (child === "GEN_RANDOM_NUMBER") {
                  resolvedValue = Math.floor(100000 + Math.random() * 900000).toString();
                }

                if (enablePreview) {
                  showPreviewModal(currentTarget, resolvedValue);
                } else {
                  injectValueEnhanced(currentTarget, resolvedValue);
                }
              }
            });

            listContent.appendChild(item);
          }
        } else if (typeof child === "object" && child !== null) {
          // Categorized Subtree Node
          const categoryName = key;
          const container = document.createElement("div");
          
          const catHeader = document.createElement("div");
          catHeader.className = "category-header";
          catHeader.textContent = categoryName;

          container.appendChild(catHeader);
          
          let hasMatchingChildren = false;

          // Recursively check children
          Object.keys(child).forEach(subKey => {
            const subVal = child[subKey];
            if (typeof subVal === "string") {
              const matchesQuery = subKey.toLowerCase().includes(query) || subVal.toLowerCase().includes(query);
              if (matchesQuery) {
                hasMatchingChildren = true;
                const item = document.createElement("div");
                item.className = "payload-item";
                
                const label = document.createElement("span");
                label.className = "payload-label";
                label.textContent = subKey;
                label.title = `${subKey} : ${subVal}`;

                item.appendChild(label);

                item.addEventListener("click", () => {
                  const currentTarget = activeElement || getDeepActiveElement(document.activeElement);
                  if (currentTarget) {
                    if (enablePreview) {
                      showPreviewModal(currentTarget, subVal);
                    } else {
                      injectValueEnhanced(currentTarget, subVal);
                    }
                  }
                });

                container.appendChild(item);
              }
            }
          });

          if (hasMatchingChildren) {
            listContent.appendChild(container);
          }
        }
      });
    }

    function generateRandomPassword() {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
      let pass = "";
      for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pass;
    }

    renderList();

    // Search input listener
    searchInput.addEventListener("input", () => {
      renderList(searchInput.value);
    });

    // Tab button click events
    tabBtnOfficial.addEventListener("click", () => {
      tabBtnOfficial.className = "tab-btn active";
      tabBtnCustom.className = "tab-btn";
      tabBtnGenerators.className = "tab-btn";
      activeTabName = "official";
      renderList(searchInput.value);
    });

    tabBtnCustom.addEventListener("click", () => {
      tabBtnOfficial.className = "tab-btn";
      tabBtnCustom.className = "tab-btn active";
      tabBtnGenerators.className = "tab-btn";
      activeTabName = "custom";
      renderList(searchInput.value);
    });

    tabBtnGenerators.addEventListener("click", () => {
      tabBtnOfficial.className = "tab-btn";
      tabBtnCustom.className = "tab-btn";
      tabBtnGenerators.className = "tab-btn active";
      activeTabName = "generators";
      renderList(searchInput.value);
    });

    // Close listener
    closeBtn.addEventListener("click", () => {
      quickOverlayRoot.remove();
      quickOverlayRoot = null;
    });

    // Drag and drop mechanics for the overlay
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - quickOverlayRoot.offsetLeft;
      offsetY = e.clientY - quickOverlayRoot.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;
      
      quickOverlayRoot.style.left = `${newX}px`;
      quickOverlayRoot.style.top = `${newY}px`;
      quickOverlayRoot.style.right = "auto";
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  });
}

