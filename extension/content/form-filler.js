import { injectPDFIntoFileInput } from './pdf-injector';
import { sleep } from '../utils/helpers';

const simulateTyping = async (element, text) => {
  element.focus();

  // React 16+ hack for native input setter
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;

  const setter = element.tagName === 'TEXTAREA' ? nativeTextAreaValueSetter : nativeInputValueSetter;

  // Clear first
  if (setter) {
    setter.call(element, '');
  } else {
    element.value = '';
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    const currentValue = element.value;
    const newValue = currentValue + char;

    element.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Key${char.toUpperCase()}`, charCode, keyCode: charCode, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: char, code: `Key${char.toUpperCase()}`, charCode, keyCode: charCode, bubbles: true }));

    if (setter) {
      setter.call(element, newValue);
    } else {
      element.value = newValue;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: `Key${char.toUpperCase()}`, charCode, keyCode: charCode, bubbles: true }));

    // Random delay between keystrokes (20ms to 80ms) - human speed
    await sleep(20, 80);
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
};

export const fillField = async (fieldDescriptor, answerString) => {
  const { element, fieldType } = fieldDescriptor;

  if (!element) return;

  if (fieldType === 'file') {
    await injectPDFIntoFileInput(element);
    return;
  }

  if (fieldType === 'checkbox') {
    const shouldCheck = answerString.toLowerCase() === 'true' || answerString.toLowerCase() === 'yes';
    if (element.checked !== shouldCheck) {
      element.click();
    }
    return;
  }

  if (fieldType === 'radio') {
    // Find radio button with matching value or label
    const radios = element.querySelectorAll('input[type=radio]');
    let targetRadio = null;

    // Try to find by value
    targetRadio = Array.from(radios).find(r => r.value === answerString);

    // Try to find by label text
    if (!targetRadio) {
      targetRadio = Array.from(radios).find(r => {
        const label = document.querySelector(`label[for="${r.id}"]`);
        return label && label.innerText.trim() === answerString;
      });
    }

    if (targetRadio) {
      targetRadio.click();
    }
    return;
  }

  if (fieldType === 'select') {
    // Native select
    if (element.tagName === 'SELECT') {
      const options = Array.from(element.options);
      const targetOption = options.find(o => o.text === answerString || o.value === answerString);
      if (targetOption) {
        element.value = targetOption.value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      // Custom dropdown
      // Click to open
      element.click();
      await new Promise(r => setTimeout(r, 500));

      // Find option in the dropdown list (usually appended to body or near element)
      const options = document.querySelectorAll('[role="option"], .artdeco-dropdown__item');
      const target = Array.from(options).find(o => o.innerText.trim() === answerString);

      if (target) {
        target.click();
      } else {
        // Close if not found
        document.body.click();
      }
    }
    return;
  }

  // Text, Number, Email, Textarea
  await simulateTyping(element, answerString);
};
