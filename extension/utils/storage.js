import { generateUUID } from './helpers';

export const getProfile = async () => {
  const result = await chrome.storage.local.get(['userProfile']);
  return result.userProfile || {};
};

export const saveProfile = async (profile) => {
  await chrome.storage.local.set({ userProfile: profile });
};

export const getSettings = async () => {
  const result = await chrome.storage.local.get(['settings']);
  return result.settings || {
    useSharedKey: true,
    autoSubmit: true,
    skipUnknownQuestions: false,
    maxJobsPerSession: 15,
    minDelayBetweenFields_ms: 200,
    maxDelayBetweenFields_ms: 600,
    minDelayBetweenJobs_ms: 8000,
    maxDelayBetweenJobs_ms: 15000
  };
};

export const saveSettings = async (settings) => {
  await chrome.storage.local.set({ settings });
};

export const getResumeBase64 = async () => {
  const result = await chrome.storage.local.get(['resumeBase64', 'resumeFileName']);
  return {
    base64: result.resumeBase64,
    fileName: result.resumeFileName
  };
};

export const saveResume = async (base64, fileName) => {
  await chrome.storage.local.set({ resumeBase64: base64, resumeFileName: fileName });
};

export const getGeminiApiKey = async () => {
  const result = await chrome.storage.local.get(['geminiApiKey']);
  return result.geminiApiKey || '';
};

export const saveGeminiApiKey = async (key) => {
  await chrome.storage.local.set({ geminiApiKey: key });
};

export const getApplicationHistory = async () => {
  const result = await chrome.storage.local.get(['applicationHistory']);
  return result.applicationHistory || [];
};

export const appendApplicationRecord = async (record) => {
  const history = await getApplicationHistory();
  const newRecord = { ...record, id: generateUUID(), appliedAt: Date.now() };
  await chrome.storage.local.set({ applicationHistory: [newRecord, ...history] });
};
