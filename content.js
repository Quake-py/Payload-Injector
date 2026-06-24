// QA & Input Validation Extension - content.js

let activeElement = null;

// En son sağ tıklanan elementi yakala (Shadow DOM ve iframe içlerini destekleyecek şekilde)
document.addEventListener("contextmenu", (event) => {
  activeElement = getDeepActiveElement(event.target);
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
