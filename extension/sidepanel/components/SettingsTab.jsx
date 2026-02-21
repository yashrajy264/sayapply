import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getGeminiApiKey, saveGeminiApiKey } from '../../utils/storage';

const SettingsTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [settings, setSettings] = useState({
    useSharedKey: true,
    autoSubmit: true,
    skipUnknownQuestions: false,
    maxJobsPerSession: 15,
    minDelayBetweenFields_ms: 200,
    maxDelayBetweenFields_ms: 600,
    minDelayBetweenJobs_ms: 8000,
    maxDelayBetweenJobs_ms: 15000
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const k = await getGeminiApiKey();
    setApiKey(k);
    const s = await getSettings();
    setSettings(s);
  };

  const handleSaveKey = async () => {
    await saveGeminiApiKey(apiKey);
    alert('API Key Saved');
  };

  const handleSaveSettings = async () => {
    await saveSettings(settings);
    alert('Settings Saved');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Gemini API Section */}
      <section className="space-y-4">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gemini API</label>
        <div className="bg-zinc-100 dark:bg-[#171717] rounded-lg border border-zinc-200 dark:border-[#333] divide-y divide-zinc-200 dark:divide-[#333] transition-colors">

          <div className="flex items-center justify-between p-4">
            <div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300 block">Say Apply Pro (Shared Key)</span>
              <span className="text-[11px] text-zinc-500 block mt-1">Uses builtin, rate-limited cloud key.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.useSharedKey}
                onChange={e => setSettings({ ...settings, useSharedKey: e.target.checked })}
              />
              <div className="w-9 h-5 bg-zinc-300 dark:bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {!settings.useSharedKey && (
            <div className="p-4 bg-zinc-50 dark:bg-[#111]">
              <span className="text-[11px] text-zinc-600 dark:text-zinc-500 mb-2 block font-medium">Use Custom API Key (Advanced)</span>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste API Key here"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-[#0f0f0f] rounded-lg border border-zinc-300 dark:border-[#333] focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors"
                />
                <button
                  onClick={handleSaveKey}
                  className="bg-zinc-900 text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Save
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 mt-2 block">Direct requests to Google. No rate limits applied by Say Apply.</span>
            </div>
          )}

        </div>
      </section>

      {/* Automation Section */}
      <section className="space-y-4">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Automation</label>
        <div className="bg-zinc-100 dark:bg-[#171717] rounded-lg border border-zinc-200 dark:border-[#333] divide-y divide-zinc-200 dark:divide-[#333] transition-colors">

          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Auto-Submit Applications</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoSubmit}
                onChange={e => setSettings({ ...settings, autoSubmit: e.target.checked })}
              />
              <div className="w-9 h-5 bg-zinc-300 dark:bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Skip Unknown Questions</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.skipUnknownQuestions}
                onChange={e => setSettings({ ...settings, skipUnknownQuestions: e.target.checked })}
              />
              <div className="w-9 h-5 bg-zinc-300 dark:bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="p-4">
            <button
              onClick={handleSaveSettings}
              className="w-full bg-zinc-900 text-white dark:bg-[#333] dark:text-white py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-[#444] transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </section>

      <div className="text-center text-[10px] text-zinc-600 pt-4">
        Say Apply v1.0.0
      </div>
    </div>
  );
};

export default SettingsTab;
