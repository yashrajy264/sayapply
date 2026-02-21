import { buildGeminiPrompt } from '../utils/helpers';
import { getProfile } from '../utils/storage';
import { fillField } from './form-filler';

let activeMicroPromptBtn = null;
let activeField = null;

export function initializeMicroPrompts() {
    document.addEventListener('focusin', handleFocusIn);

    // Hide when clicking outside
    document.addEventListener('click', (e) => {
        if (activeMicroPromptBtn && !activeMicroPromptBtn.contains(e.target) && e.target !== activeField) {
            hideMicroPrompt();
        }
    });

    // Also close on scroll to prevent floating weirdness
    window.addEventListener('scroll', () => {
        hideMicroPrompt();
    }, { passive: true });
}

function handleFocusIn(e) {
    const target = e.target;
    if (!target) return;

    if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text')) {
        showMicroPrompt(target);
    } else {
        hideMicroPrompt();
    }
}

function hideMicroPrompt() {
    if (activeMicroPromptBtn) {
        activeMicroPromptBtn.remove();
        activeMicroPromptBtn = null;
    }
}

function showMicroPrompt(element) {
    hideMicroPrompt(); // clear any existing

    activeField = element;

    const btn = document.createElement('button');
    btn.innerHTML = '✨ Say';
    btn.style.position = 'absolute';
    btn.style.zIndex = '999998';
    btn.style.backgroundColor = '#10b981';
    btn.style.color = '#ffffff';
    btn.style.border = 'none';
    btn.style.borderRadius = '12px';
    btn.style.padding = '4px 8px';
    btn.style.fontSize = '12px';
    btn.style.fontWeight = 'bold';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    btn.title = 'AI Rewrite or Answer';

    // Position relative to the field
    const rect = element.getBoundingClientRect();
    btn.style.top = `${window.scrollY + rect.top - 15}px`;
    btn.style.left = `${window.scrollX + rect.right - 40}px`;

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openMicroPromptInterface(element);
    };

    document.body.appendChild(btn);
    activeMicroPromptBtn = btn;
}

function openMicroPromptInterface(element) {
    // Replace the button with an input field
    if (activeMicroPromptBtn) activeMicroPromptBtn.remove();

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.zIndex = '999999';
    container.style.backgroundColor = '#1f2937';
    container.style.padding = '8px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    container.style.display = 'flex';
    container.style.gap = '8px';

    const rect = element.getBoundingClientRect();
    container.style.top = `${window.scrollY + rect.top - 45}px`;
    container.style.left = `${window.scrollX + rect.right - 200}px`;

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g., Make it sound leadership focused...';
    input.style.width = '200px';
    input.style.padding = '4px 8px';
    input.style.borderRadius = '4px';
    input.style.border = '1px solid #374151';
    input.style.backgroundColor = '#111827';
    input.style.color = '#ffffff';
    input.style.fontSize = '12px';

    const submitBtn = document.createElement('button');
    submitBtn.innerText = 'Go';
    submitBtn.style.backgroundColor = '#10b981';
    submitBtn.style.color = 'white';
    submitBtn.style.border = 'none';
    submitBtn.style.borderRadius = '4px';
    submitBtn.style.padding = '4px 12px';
    submitBtn.style.cursor = 'pointer';
    submitBtn.style.fontSize = '12px';
    submitBtn.style.fontWeight = 'bold';

    container.appendChild(input);
    container.appendChild(submitBtn);
    document.body.appendChild(container);
    activeMicroPromptBtn = container; // Treat container as the active floating UI

    input.focus();

    const handleSubmit = async () => {
        const command = input.value.trim();
        if (!command) {
            hideMicroPrompt();
            return;
        }

        submitBtn.innerText = '...';
        submitBtn.disabled = true;
        input.disabled = true;

        try {
            const userProfile = await getProfile();
            const currentVal = element.value;
            // Get label or placeholder context
            const contextLabel = element.getAttribute('aria-label') || element.placeholder || element.name || 'this field';

            let promptText = `User Profile:\n${JSON.stringify(userProfile, null, 2)}\n\n`;
            promptText += `Field: ${contextLabel}\n`;
            if (currentVal) {
                promptText += `Current Answer: "${currentVal}"\n`;
            }
            promptText += `\nUser Command: "${command}"\n\nRewrite or generate the answer according to the command. Return ONLY the final text.`;

            const response = await chrome.runtime.sendMessage({
                type: 'GEMINI_REQUEST',
                prompt: promptText
            });

            if (response.success && response.result !== 'UNKNOWN') {
                await fillField({ element, fieldType: element.tagName === 'TEXTAREA' ? 'textarea' : 'text' }, response.result);
            } else {
                alert("Say Apply: Failed to generate response.");
            }
        } catch (err) {
            console.error(err);
        }

        hideMicroPrompt();
    };

    submitBtn.onclick = handleSubmit;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') handleSubmit();
        if (e.key === 'Escape') hideMicroPrompt();
    };
}
