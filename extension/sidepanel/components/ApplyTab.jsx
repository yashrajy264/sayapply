import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getApplicationHistory } from '../../utils/storage';
import JobStatusCard from './JobStatusCard';
import QuestionAlert from './QuestionAlert';

const ApplyTab = () => {
  const [config, setConfig] = useState({
    keyword: '',
    location: '',
    remoteFilter: 'Any', // Any, Remote, On-site, Hybrid
    experienceLevel: [],
    maxJobs: 15
  });

  const [isRunning, setIsRunning] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [jobQueue, setJobQueue] = useState([]);

  useEffect(() => {
    // Listen for messages from background
    const listener = (message) => {
      if (message.type === 'UNKNOWN_QUESTION') {
        setAlertData(message.payload);
        setIsRunning(false); // Paused
      }
      if (message.type === 'APPLICATION_STATUS_UPDATE') {
        setJobQueue(prev => [message.payload, ...prev]);
      }
      if (message.type === 'AUTOMATION_COMPLETE') {
        setIsRunning(false);
        alert(`Automation Complete! Processed ${message.payload.totalApplied} jobs.`);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    chrome.runtime.sendMessage({
      type: 'START_AUTOMATION',
      payload: {
        keyword: config.keyword,
        location: config.location,
        filters: {
          remote: config.remoteFilter,
          experience: config.experienceLevel
        }
      }
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
  };

  const handleAlertResolve = (answer) => {
    // Send answer back to background
    chrome.runtime.sendMessage({
      type: 'USER_ANSWER',
      payload: {
        questionLabel: alertData.questionLabel,
        answer: answer
      }
    });
    setAlertData(null);
    setIsRunning(true); // Resume
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Alert Section */}
      {alertData && (
        <QuestionAlert
          data={alertData}
          onResolve={handleAlertResolve}
          onSkip={() => {
            setAlertData(null);
            setIsRunning(true);
          }}
        />
      )}

      {/* Configuration Section */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Job Criteria</label>
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Job Title (e.g. React Developer)"
                value={config.keyword}
                onChange={e => setConfig({ ...config, keyword: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
              />
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Location (e.g. Remote)"
                value={config.location}
                onChange={e => setConfig({ ...config, location: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
              />
              <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <div className="flex items-center justify-between bg-zinc-100 dark:bg-[#171717] p-2.5 rounded-lg border border-transparent transition-colors">
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Max Applications</span>
              <input
                type="number"
                value={config.maxJobs}
                onChange={e => setConfig({ ...config, maxJobs: parseInt(e.target.value) })}
                className="w-16 p-1 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-[#333] rounded text-center text-sm text-zinc-900 dark:text-white focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={!config.keyword || !config.location}
              className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black py-2.5 rounded-lg font-semibold hover:bg-zinc-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Auto-Apply
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/50 py-2.5 rounded-lg font-semibold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Execution
            </button>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Activity Log</h3>
        {jobQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 dark:text-zinc-600 border border-dashed border-zinc-300 dark:border-[#333] rounded-lg bg-zinc-50 dark:bg-[#171717]/50 transition-colors">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-xs font-medium">Ready to start</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobQueue.map((job, idx) => (
              <JobStatusCard key={idx} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyTab;
