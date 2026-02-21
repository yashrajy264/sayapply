import { detectFormFields } from './field-detector';
import { fillField } from './form-filler';
import { getProfile, getSettings } from '../utils/storage';
import { findAnswer, saveAnswer } from '../utils/question-bank';
import { sleep, humanLikeSleep, buildGeminiPrompt } from '../utils/helpers';

let isRunning = false;
let shouldStop = false;
let sessionSettings = {};
let userProfile = {};
let currentJobDescription = '';
let currentJobDetails = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_AUTOMATION') {
    startAutomation(message.payload);
  }
  if (message.type === 'STOP_AUTOMATION') {
    shouldStop = true;
    isRunning = false;
  }
});

function extractJobDescription() {
  const selectors = [
    '.jobs-description__content',
    '.jobs-description-content__text',
    '#job-details',
    '.job-details-jobs-unified-top-card__primary-description'
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) return el.innerText.trim();
  }
  return '';
}

async function startAutomation(payload) {
  if (isRunning) return;
  isRunning = true;
  shouldStop = false;

  const { keyword, location, filters } = payload;

  // Load settings and profile
  sessionSettings = await getSettings();
  userProfile = await getProfile();

  // Navigate to search
  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`;
  window.location.href = searchUrl;

  // Wait for page load
  await waitForElement('.jobs-search-results-list');

  // Apply Easy Apply filter
  await clickEasyApplyFilter();

  // Collect jobs
  const jobCards = document.querySelectorAll('.job-card-container');
  let processedCount = 0;

  for (const card of jobCards) {
    if (shouldStop || processedCount >= sessionSettings.maxJobsPerSession) break;

    try {
      await processJobCard(card);
      processedCount++;
    } catch (e) {
      console.error('Job processing error', e);
      // Report error
      chrome.runtime.sendMessage({
        type: 'APPLICATION_STATUS_UPDATE',
        payload: { status: 'error', error: e.message }
      });
    }

    await humanLikeSleep(); // Use human-like sleep between jobs
  }

  chrome.runtime.sendMessage({
    type: 'AUTOMATION_COMPLETE',
    payload: { totalApplied: processedCount }
  });

  isRunning = false;
}

async function processJobCard(card) {
  card.click();
  await humanLikeSleep(); // Wait for details to load naturally

  // Extract JD *before* clicking Apply
  currentJobDescription = extractJobDescription();
  console.log('Extracted JD length:', currentJobDescription.length);

  // Extract Job Details for Logging
  const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title');
  const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name');

  currentJobDetails = {
    role: titleEl ? titleEl.innerText.trim() : 'Unknown Role',
    company: companyEl ? companyEl.innerText.trim() : 'Unknown Company',
    link: window.location.href,
    date: Date.now(),
    status: 'Applied'
  };

  const easyApplyButton = document.querySelector('.jobs-apply-button');
  if (!easyApplyButton) {
    // Report skipped
    return;
  }

  easyApplyButton.click();
  await waitForElement('.jobs-easy-apply-modal');

  await fillEasyApplyModal();
}

async function fillEasyApplyModal() {
  let step = 0;
  const maxSteps = 15;

  while (step < maxSteps) {
    if (shouldStop) throw new Error('Stopped by user');

    const modal = document.querySelector('.jobs-easy-apply-modal');
    if (!modal) break; // Closed or finished

    // Check for Submit
    const submitButton = modal.querySelector('button[aria-label="Submit application"]');
    if (submitButton) {
      if (sessionSettings.autoSubmit) {
        await humanLikeSleep(); // Pause before submitting
        submitButton.click();
        await waitForElementToDisappear('.jobs-easy-apply-modal');

        // Log application
        chrome.storage.local.get(['applications_log'], (res) => {
          const logs = res.applications_log || [];
          currentJobDetails.status = 'Applied';
          logs.push(currentJobDetails);
          chrome.storage.local.set({ applications_log: logs });
        });

        chrome.runtime.sendMessage({
          type: 'APPLICATION_STATUS_UPDATE',
          payload: { ...currentJobDetails, status: 'Submitted' }
        });
        return;
      } else {
        // Pause for review
        chrome.runtime.sendMessage({
          type: 'APPLICATION_STATUS_UPDATE',
          payload: { ...currentJobDetails, status: 'Review Needed: Click Submit in Browser' }
        });

        // Wait for the modal to disappear (user clicked submit or closed it)
        await waitForElementToDisappear('.jobs-easy-apply-modal', 300000); // Wait up to 5 minutes

        // Assume user submitted or dismissed. Log as User Action.
        chrome.storage.local.get(['applications_log'], (res) => {
          const logs = res.applications_log || [];
          currentJobDetails.status = 'User Action Required / Done';
          logs.push(currentJobDetails);
          chrome.storage.local.set({ applications_log: logs });
        });

        chrome.runtime.sendMessage({
          type: 'APPLICATION_STATUS_UPDATE',
          payload: { ...currentJobDetails, status: 'User Action Completed' }
        });

        return;
      }
    }

    // Detect fields
    const fields = detectFormFields(modal);

    for (const field of fields) {
      if (field.isAlreadyFilled) continue;

      const answer = await getAnswerForField(field);
      if (answer) {
        await fillField(field, answer);
        await sleep(sessionSettings.minDelayBetweenFields_ms, sessionSettings.maxDelayBetweenFields_ms); // Keep strict timing for filling, or randomize slightly
      }
    }

    // Next
    const nextButton = modal.querySelector('button[aria-label="Continue to next step"], button[aria-label="Review your application"]');
    if (nextButton) {
      await humanLikeSleep(); // Pause before clicking next
      nextButton.click();
      await sleep(1000, 2000);
      step++;
    } else {
      break; // Stuck?
    }
  }
}

async function getAnswerForField(field) {
  // 1. Check Question Bank
  const saved = await findAnswer(field.label);
  if (saved) return saved.answer;

  // 1.5 Check Dealbreakers / Hardcoded Defaults
  const lbl = field.label.toLowerCase();

  // Salary
  if (lbl.includes('salary') || lbl.includes('compensation') || lbl.includes('pay')) {
    if (userProfile.expectedSalary) return userProfile.expectedSalary;
  }

  // Relocation
  if (lbl.includes('relocat')) {
    if (userProfile.relocate) return userProfile.relocate;
  }

  // Sponsorship / Visa
  if (lbl.includes('sponsor') || lbl.includes('visa') || lbl.includes('auth')) {
    if (userProfile.sponsorship) return userProfile.sponsorship;
  }

  // 2. Ask Gemini (Pass JD)
  const prompt = buildGeminiPrompt('fill_text_field', userProfile, field.label, field.fieldType, field.options, currentJobDescription);
  const response = await chrome.runtime.sendMessage({
    type: 'GEMINI_REQUEST',
    prompt: prompt
  });

  if (response.success && response.result !== 'UNKNOWN') {
    await saveAnswer(field.label, field.fieldType, field.options, response.result, 'gemini');
    return response.result;
  }

  // 3. Ask User
  if (sessionSettings.skipUnknownQuestions) {
    throw new Error('Skipped unknown question');
  }

  // Send alert to side panel
  chrome.runtime.sendMessage({
    type: 'UNKNOWN_QUESTION',
    payload: {
      questionLabel: field.label,
      fieldType: field.fieldType,
      options: field.options
    }
  });

  // Wait for user answer
  return await waitForUserAnswer(field.label);
}

async function waitForUserAnswer(label) {
  const key = `pendingAnswer_${btoa(label)}`;
  const startTime = Date.now();

  while (Date.now() - startTime < 300000) { // 5 min timeout
    if (shouldStop) throw new Error('Stopped');

    const result = await chrome.storage.local.get([key]);
    if (result[key]) {
      await chrome.storage.local.remove([key]);
      // Save to bank
      await saveAnswer(label, 'text', null, result[key], 'user');
      return result[key];
    }

    await sleep(500, 1000);
  }

  throw new Error('Timeout waiting for user');
}

async function waitForElement(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (document.querySelector(selector)) return document.querySelector(selector);
    await sleep(100, 300);
  }
  throw new Error(`Timeout waiting for ${selector}`);
}

async function waitForElementToDisappear(selector, timeout = 10000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (!document.querySelector(selector)) return;
    await sleep(100, 300);
  }
}

async function clickEasyApplyFilter() {
  // This is tricky as selectors change. 
  // Look for button with text "Easy Apply"
  const buttons = Array.from(document.querySelectorAll('button'));
  const easyApplyBtn = buttons.find(b => b.innerText.includes('Easy Apply'));
  if (easyApplyBtn) {
    easyApplyBtn.click();
    await sleep(2000, 3000);
  }
}
