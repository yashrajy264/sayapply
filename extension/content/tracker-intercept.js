import { appendApplicationRecord } from '../utils/storage';

export function initializeTracker() {
    // We listen to the capturing phase to ensure we catch it before any preventDefault
    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('click', handlePossibleSubmitClick, true);
}

async function handleFormSubmit(e) {
    await recordApplication();
}

async function handlePossibleSubmitClick(e) {
    const target = e.target;
    if (!target) return;

    const text = (target.innerText || target.value || target.getAttribute('aria-label') || '').toLowerCase();

    // If it's a submit button or looks like one
    if (
        (target.tagName === 'BUTTON' && target.type === 'submit') ||
        (target.tagName === 'INPUT' && target.type === 'submit') ||
        text.includes('submit application') ||
        text.includes('apply now') ||
        (text.includes('submit') && target.tagName === 'BUTTON')
    ) {
        // Wait a tiny bit to see if form submission succeeds or redirects
        setTimeout(async () => {
            await recordApplication();
        }, 1000);
    }
}

async function recordApplication() {
    try {
        const title = document.querySelector('h1, .job-title, [data-test="job-title"]')?.innerText || document.title;
        const company = document.querySelector('.company-name, [data-test="company-name"], title')?.innerText || window.location.hostname;

        // Prevent generic/duplicate saves within the same minute
        const record = {
            jobTitle: title.trim().substring(0, 100),
            company: company.trim().substring(0, 50),
            url: window.location.href,
            status: 'Submitted'
        };

        await appendApplicationRecord(record);
        console.log("Say Apply: Application intercepted and recorded!", record);
    } catch (err) {
        console.error("Say Apply Tracker Error:", err);
    }
}
