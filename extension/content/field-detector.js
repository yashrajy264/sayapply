export const detectFormFields = (modalElement) => {
  if (!modalElement) return [];
  
  const fields = [];
  
  // Text inputs
  const textInputs = modalElement.querySelectorAll('input[type=text], input[type=number], input[type=tel], input[type=email]');
  textInputs.forEach(input => {
    fields.push({
      element: input,
      label: getLabelForElement(input),
      fieldType: input.type,
      isRequired: input.required,
      isAlreadyFilled: !!input.value
    });
  });
  
  // Textareas
  const textareas = modalElement.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    fields.push({
      element: textarea,
      label: getLabelForElement(textarea),
      fieldType: 'textarea',
      isRequired: textarea.required,
      isAlreadyFilled: !!textarea.value
    });
  });
  
  // Native Selects
  const selects = modalElement.querySelectorAll('select');
  selects.forEach(select => {
    const options = Array.from(select.options).map(o => o.text);
    fields.push({
      element: select,
      label: getLabelForElement(select),
      fieldType: 'select',
      options: options,
      isRequired: select.required,
      isAlreadyFilled: !!select.value
    });
  });
  
  // Custom Dropdowns (LinkedIn specific)
  const customDropdowns = modalElement.querySelectorAll('[data-test-text-entity-list-form-select]');
  customDropdowns.forEach(dropdown => {
    const label = getLabelForElement(dropdown);
    // Try to find options if possible, usually they are loaded dynamically on click
    fields.push({
      element: dropdown,
      label: label,
      fieldType: 'select',
      options: null, // Options are dynamic
      isRequired: true, // Usually required
      isAlreadyFilled: !!dropdown.querySelector('option:checked') || !!dropdown.value
    });
  });
  
  // Radio Groups
  const radioGroups = modalElement.querySelectorAll('[data-test-form-builder-radio-button-form-component]');
  radioGroups.forEach(group => {
    const legend = group.querySelector('legend');
    const label = legend ? legend.innerText : '';
    const radios = group.querySelectorAll('input[type=radio]');
    const options = Array.from(radios).map(r => {
      const label = document.querySelector(`label[for="${r.id}"]`);
      return label ? label.innerText : r.value;
    });
    
    fields.push({
      element: group,
      label: label,
      fieldType: 'radio',
      options: options,
      isRequired: true,
      isAlreadyFilled: Array.from(radios).some(r => r.checked)
    });
  });
  
  // Checkboxes
  const checkboxes = modalElement.querySelectorAll('input[type=checkbox]');
  checkboxes.forEach(checkbox => {
    fields.push({
      element: checkbox,
      label: getLabelForElement(checkbox),
      fieldType: 'checkbox',
      isRequired: checkbox.required,
      isAlreadyFilled: checkbox.checked
    });
  });
  
  // File Inputs
  const fileInputs = modalElement.querySelectorAll('input[type=file]');
  fileInputs.forEach(input => {
    fields.push({
      element: input,
      label: getLabelForElement(input),
      fieldType: 'file',
      isRequired: input.required,
      isAlreadyFilled: !!input.files.length
    });
  });
  
  return fields;
};

function getLabelForElement(element) {
  // 1. Aria Label
  if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');
  
  // 2. Aria Labelled By
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.innerText;
  }
  
  // 3. Label tag
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.innerText;
  }
  
  // 4. Closest label container
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.innerText;
  
  // 5. Previous sibling
  const prev = element.previousElementSibling;
  if (prev && prev.tagName === 'LABEL') return prev.innerText;
  
  // 6. Closest .fb-form-element label
  const container = element.closest('.fb-form-element');
  if (container) {
    const label = container.querySelector('label');
    if (label) return label.innerText;
  }
  
  return '';
}
