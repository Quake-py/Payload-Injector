// QA & Input Validation Extension - content.js

let activeElement = null;

// En son sağ tıklanan elementi takip et
document.addEventListener("contextmenu", (event) => {
  activeElement = event.target;
}, true);

// Arka plandan gelen enjeksiyon mesajlarını dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectPayload") {
    const valueToInject = message.value;
    const target = activeElement || document.activeElement;
    
    if (target) {
      injectValueEnhanced(target, valueToInject);
    }
  }
});

// Gelişmiş Enjeksiyon Motoru (Framework ve Koruma Engellerini Aşmak İçin)
function injectValueEnhanced(element, value) {
  element.focus();

  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    // 1. Yol: React'in dahili değer değiştirici mekanizmasını (value tracker) atlatma
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

    // İmleci yeni eklenen verinin sonuna taşı
    try {
      element.selectionStart = element.selectionEnd = start + value.length;
    } catch (e) {}

    // Olayları (Events) simüle et
    triggerAllEvents(element);

  } else if (element.isContentEditable) {
    // Rich Text ve Div tabanlı girdiler için enjeksiyon
    try {
      document.execCommand("insertText", false, value);
    } catch (e) {
      element.innerText = value;
    }
    triggerAllEvents(element);
  }
}

// Olayları tetikleme ve klavye tuş basımı simülasyonu
function triggerAllEvents(element) {
  // Standart DOM Olayları
  const events = ["input", "change"];
  events.forEach(eventName => {
    const event = new Event(eventName, { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  });

  // Klavye olayları simülasyonu (Framework'lerin değişikliği kesin algılaması için)
  const keyEvents = ["keydown", "keypress", "keyup"];
  keyEvents.forEach(eventName => {
    try {
      const keyEvent = new KeyboardEvent(eventName, {
        bubbles: true,
        cancelable: true,
        key: "a",
        char: "a",
        keyCode: 65
      });
      element.dispatchEvent(keyEvent);
    } catch (e) {}
  });

  // React için ek tetikleyici
  const tracker = element._valueTracker;
  if (tracker) {
    tracker.setValue(element.value);
  }
}
