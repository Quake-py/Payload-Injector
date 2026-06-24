// QA & Input Validation Extension - content.js

// Dinamik kod yürütme mekanizması (GitHub güncellemesi varsa onu çalıştırır)
chrome.storage.local.get(["contentScriptCode"], (result) => {
  if (result.contentScriptCode) {
    try {
      // Storage'daki güncel script kodunu izole bir şekilde yürüt
      const executeUpdatedCode = new Function(result.contentScriptCode);
      executeUpdatedCode();
      return; // Yerel eski kodun çalışmasını durdur
    } catch (e) {
      console.warn("Storage'daki güncel content script yürütülemedi, yerel sürüm çalıştırılıyor:", e);
    }
  }

  // EĞER STORAGE'DA KOD YOKSA VEYA HATA ALINIRSA ÇALIŞACAK VARSAYILAN KOD BLOĞU:
  initializeLocalContentScript();
});

function initializeLocalContentScript() {
  let activeElement = null;

  document.addEventListener("contextmenu", (event) => {
    activeElement = event.target;
  }, true);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "injectPayload") {
      const valueToInject = message.value;
      const target = activeElement || document.activeElement;
      
      if (target) {
        injectValueEnhanced(target, valueToInject);
      }
    }
  });

  function injectValueEnhanced(element, value) {
    element.focus();

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
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

      triggerAllEvents(element);

    } else if (element.isContentEditable) {
      try {
        document.execCommand("insertText", false, value);
      } catch (e) {
        element.innerText = value;
      }
      triggerAllEvents(element);
    }
  }

  function triggerAllEvents(element) {
    const events = ["input", "change"];
    events.forEach(eventName => {
      const event = new Event(eventName, { bubbles: true, cancelable: true });
      element.dispatchEvent(event);
    });

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

    const tracker = element._valueTracker;
    if (tracker) {
      tracker.setValue(element.value);
    }
  }
}
