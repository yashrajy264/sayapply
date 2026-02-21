export function generateSemanticDOM(rootElement = document.body) {
    const interactableSelectors = 'input:not([type="hidden"]), textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="listbox"], [role="radiogroup"]';
    const interactables = rootElement.querySelectorAll(interactableSelectors);

    const fieldMap = new Map();
    const fieldsData = [];

    interactables.forEach((el, index) => {
        // Skip hidden or disabled elements
        const rect = el.getBoundingClientRect();
        if (el.disabled || rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).visibility === 'hidden') {
            return;
        }

        const id = `sayapply_field_${index}`;
        fieldMap.set(id, el);

        const labelText = getLabelForElement(el).trim();
        const placeholder = el.getAttribute('placeholder') || '';
        const nameAttr = el.getAttribute('name') || '';
        const valueAttr = el.value || '';

        // Get nearby text context (parent and previous sibling)
        let surroundingText = '';
        if (el.parentElement) {
            surroundingText = el.parentElement.innerText?.substring(0, 200).replace(/\n/g, ' ') || '';
        }

        let fieldInfo = {
            id,
            tagName: el.tagName.toLowerCase(),
            type: el.type || el.getAttribute('role') || 'text',
            label: labelText,
            placeholder,
            name: nameAttr,
            context: surroundingText,
            isAlreadyFilled: !!valueAttr
        };

        if (el.tagName.toLowerCase() === 'select' || el.getAttribute('role') === 'listbox') {
            let options = [];
            if (el.tagName.toLowerCase() === 'select') {
                options = Array.from(el.options).map(o => o.text.trim());
            } else {
                // Try to find options for custom dropdowns
                const optEls = document.querySelectorAll(`[aria-labelledby="${el.id}"] [role="option"], #${el.getAttribute('aria-controls')} [role="option"]`);
                options = Array.from(optEls).map(o => o.innerText.trim());
            }
            fieldInfo.options = options;
        }

        // Handle radio buttons grouped by name
        if (el.type === 'radio') {
            fieldInfo.value = el.value;
        }

        fieldsData.push(fieldInfo);
    });

    return { fieldsData, fieldMap };
}

function getLabelForElement(element) {
    if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');

    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
        const labelEl = document.getElementById(labelledBy);
        if (labelEl) return labelEl.innerText;
    }

    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.innerText;
    }

    const parentLabel = element.closest('label');
    if (parentLabel) return parentLabel.innerText;

    const prev = element.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.innerText;

    // Look for previous text node or span that might be a label
    const wrapper = element.closest('.fb-form-element, .form-group, .application-question');
    if (wrapper) {
        const label = wrapper.querySelector('label, .label-text');
        if (label) return label.innerText;
        return wrapper.innerText.split('\n')[0]; // fallback to first line of wrapper
    }

    return '';
}
