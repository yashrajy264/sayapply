import { callGemini } from './utils/gemini';
import { analyzeJobFit } from './utils/api';
import { getGeminiApiKey, saveAnswer, getProfile, getSettings } from './utils/storage';
import { buildGeminiPrompt } from './utils/helpers';

// Open Side Panel on icon click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GEMINI_REQUEST') {
    handleGeminiRequest(message, sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === 'JOB_ANALYSIS') {
    handleJobAnalysis(message, sendResponse);
    return true;
  }

  if (message.type === 'GENERATE_OUTREACH') {
    handleGenerateOutreach(message, sendResponse);
    return true;
  }

  if (message.type === 'TAILOR_RESUME') {
    handleTailorResume(message, sendResponse);
    return true;
  }

  if (message.type === 'SCORE_JOBS_BATCH') {
    handleScoreJobsBatch(message.payload);
  }

  if (message.type === 'UNKNOWN_QUESTION') {
    // Forward to side panel
    chrome.runtime.sendMessage({
      type: 'UNKNOWN_QUESTION',
      payload: message.payload
    });
  }

  if (message.type === 'APPLICATION_STATUS_UPDATE') {
    // Forward to side panel
    chrome.runtime.sendMessage({
      type: 'APPLICATION_STATUS_UPDATE',
      payload: message.payload
    });
  }

  if (message.type === 'AUTOMATION_COMPLETE') {
    // Forward to side panel
    chrome.runtime.sendMessage({
      type: 'AUTOMATION_COMPLETE',
      payload: message.payload
    });
  }

  if (message.type === 'USER_ANSWER') {
    handleUserAnswer(message.payload);
  }

  if (message.type === 'CHECK_SUBSCRIPTION_STATUS') {
    checkSubscriptionStatus(sendResponse);
    return true;
  }
});

async function handleGeminiRequest(message, sendResponse) {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      sendResponse({ success: false, error: 'API Key not found' });
      return;
    }

    const result = await callGemini(message.prompt, apiKey, message.options);
    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleJobAnalysis(message, sendResponse) {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      sendResponse({ success: false, error: 'API Key not found' });
      return;
    }

    const { jobDescription, profile } = message.payload;
    const result = await analyzeJobFit(jobDescription, profile, apiKey);
    sendResponse(result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGenerateOutreach(message, sendResponse) {
  try {
    const apiKey = await getGeminiApiKey();
    const profile = await getProfile();
    const { title, company, snippet } = message.payload;

    const context = `Job Title: ${title}\nCompany: ${company}\nJob Snippet: ${snippet}`;
    const prompt = buildGeminiPrompt('generate_outreach', profile, '', context);

    const result = await callGemini(prompt, apiKey, { temperature: 0.7 });

    if (result && result.success) {
      let text = result.result;
      if (text.startsWith('```json')) {
        text = text.replace(/```json/g, '').replace(/```/g, '');
      }
      try {
        const parsed = JSON.parse(text);
        sendResponse({ success: true, result: parsed });
      } catch (e) {
        sendResponse({ success: false, error: "Parsing error in outreach generation" });
      }
    } else {
      sendResponse(result);
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleTailorResume(message, sendResponse) {
  try {
    const apiKey = await getGeminiApiKey();
    const profile = await getProfile();
    const { jobDescription } = message.payload;

    if (!jobDescription) {
      sendResponse({ success: false, error: "No job description provided" });
      return;
    }

    const context = `Job Description:\n${jobDescription}`;
    const prompt = buildGeminiPrompt('tailor_resume', profile, '', context);

    const result = await callGemini(prompt, apiKey, { temperature: 0.3 });

    if (result && result.success) {
      let text = result.result;
      if (text.startsWith('```json')) {
        text = text.replace(/```json/g, '').replace(/```/g, '');
      }
      try {
        const parsed = JSON.parse(text);
        sendResponse({ success: true, result: parsed });
      } catch (e) {
        sendResponse({ success: false, error: "Parsing error in resume tailoring" });
      }
    } else {
      sendResponse(result);
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleScoreJobsBatch(scrapedJobs) {
  try {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      chrome.runtime.sendMessage({ type: 'SCRAPED_JOBS_RESULTS', payload: scrapedJobs.map(j => ({ ...j, score: 0, reason: "No API Key" })) });
      return;
    }

    const profile = await getProfile();

    // Prepare prompt
    const promptPayload = scrapedJobs.map((j, idx) => ({
      id: idx,
      title: j.title,
      company: j.company,
      snippet: j.snippet
    }));

    const prompt = buildGeminiPrompt('score_batch', profile, promptPayload);

    const result = await callGemini(prompt, apiKey, { temperature: 0.2 });

    if (result && result.success && result.result !== 'UNKNOWN') {
      try {
        let resultText = result.result;
        if (resultText.startsWith('```json')) {
          resultText = resultText.replace(/```json/g, '').replace(/```/g, '');
        }
        const scoredArray = JSON.parse(resultText);

        // Merge scores into original list
        const finalJobs = scrapedJobs.map((job, idx) => {
          const match = scoredArray.find(s => s.id === idx) || { score: 0, reason: "Failed to score" };
          return { ...job, score: match.score, reason: match.reason };
        });

        // Sort by highest score first
        finalJobs.sort((a, b) => b.score - a.score);

        chrome.runtime.sendMessage({ type: 'SCRAPED_JOBS_RESULTS', payload: finalJobs });
      } catch (e) {
        console.error("Failed parsing score batch response.", e);
        chrome.runtime.sendMessage({ type: 'SCRAPED_JOBS_RESULTS', payload: scrapedJobs.map(j => ({ ...j, score: 0, reason: "Parsing Error" })) });
      }
    } else {
      chrome.runtime.sendMessage({ type: 'SCRAPED_JOBS_RESULTS', payload: scrapedJobs.map(j => ({ ...j, score: 0, reason: "Gemini AI Error" })) });
    }
  } catch (e) {
    console.error("Score Error:", e);
    chrome.runtime.sendMessage({ type: 'SCRAPED_JOBS_RESULTS', payload: scrapedJobs.map(j => ({ ...j, score: 0, reason: "System Error" })) });
  }
}

async function handleUserAnswer(payload) {
  const { questionLabel, answer } = payload;
  // Save to storage so content script can pick it up
  const key = `pendingAnswer_${btoa(questionLabel)}`;
  await chrome.storage.local.set({ [key]: answer });
}

async function checkSubscriptionStatus(sendResponse) {
  try {
    // Stub for monetization verification
    // In production, this would verify a token or check a database
    const profile = await getProfile();
    // Default to free
    sendResponse({ isPro: false });
  } catch (error) {
    sendResponse({ isPro: false, error: error.message });
  }
}
