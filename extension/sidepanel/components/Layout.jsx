import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    chrome.storage.local.get(['theme'], (result) => {
      const t = result.theme || 'dark';
      setTheme(t);
      if (t === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'apply', label: 'Apply' },
    { id: 'search', label: 'Search' },
    { id: 'dashboard', label: 'Tracking' },
    { id: 'questions', label: 'Q&A' },
    { id: 'coverletter', label: 'Letter' }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-[#0f0f0f] text-zinc-900 dark:text-[#EDEDED] font-sans transition-colors relative">
      <Toaster position="bottom-center" theme={theme} />
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-[#333] sticky top-0 z-10 bg-zinc-50 dark:bg-[#0f0f0f] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-white">Say Apply</h1>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-zinc-600 bg-zinc-200 dark:text-zinc-300 dark:bg-[#333]">
              PRO
            </span>
          </div>
          <div className="flex gap-1 items-center">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md transition-colors text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-[#171717]"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                // Sun Icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon Icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-1.5 rounded-md transition-colors ${activeTab === 'settings' ? 'bg-zinc-200 text-black dark:bg-[#333] dark:text-white' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-[#171717]'}`}
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="flex p-1 rounded-lg bg-zinc-100 dark:bg-[#171717] border border-zinc-200 dark:border-[#333]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all ${activeTab === tab.id
                ? 'bg-white dark:bg-[#333] text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {children}
      </div>
    </div>
  );
};

export default Layout;

