import { getSettings } from './storage';

export const callGemini = async (prompt, apiKey, options = {}) => {
  const settings = await getSettings();
  const useSharedKey = settings.useSharedKey;

  if (!useSharedKey && !apiKey) {
    return { success: false, error: 'Custom API Key missing. Please provide a key or enable Say Apply Pro.' };
  }

  const payload = {
    prompt: prompt,
    temperature: options.temperature || 0.2,
    ...(!useSharedKey && {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.2,
        maxOutputTokens: options.maxOutputTokens || 600
      }
    })
  };

  const endpoint = useSharedKey
    ? 'http://localhost:3000/api/gemini'
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(useSharedKey ? { prompt: payload.prompt, temperature: payload.temperature } : payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403) return { success: false, error: 'Invalid API Key' };
      if (response.status === 429) return { success: false, error: 'Rate Limit Exceeded' };
      return { success: false, error: `Server Error: ${response.status}` };
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      return { success: true, result: text.trim() };
    } else {
      return { success: false, error: 'Empty or malformed response' };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out' };
    }
    return { success: false, error: error.message };
  }
};
