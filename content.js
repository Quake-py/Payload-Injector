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
      injectValueEnhanced(target, valueToInject);
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
