import React, { useState, useEffect } from 'react';

const DashboardTab = () => {
    const [applications, setApplications] = useState([]);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = () => {
        chrome.storage.local.get(['applications_log'], (result) => {
            setApplications(result.applications_log || []);
        });
    };

    const clearApplications = () => {
        if (confirm('Are you sure you want to clear your application history?')) {
            setIsClearing(true);
            chrome.storage.local.set({ applications_log: [] }, () => {
                setApplications([]);
                setIsClearing(false);
            });
        }
    };

    return (
        <div className="space-y-6 pb-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Application Tracking</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        History of jobs applied to via Say Apply.
                    </p>
                </div>
                {applications.length > 0 && (
                    <button
                        onClick={clearApplications}
                        disabled={isClearing}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                    >
                        Clear History
                    </button>
                )}
            </div>

            {/* List */}
            <div className="space-y-3">
                {applications.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-50 dark:bg-[#111] rounded-lg border border-zinc-200 dark:border-[#222] transition-colors">
                        <p className="text-sm text-zinc-500 w-full">No applications tracked yet.</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">Start applying using the extension to see history here.</p>
                    </div>
                ) : (
                    applications.slice().reverse().map((app, index) => (
                        <div key={index} className="p-4 bg-white dark:bg-black border border-zinc-200 dark:border-[#333] rounded-lg hover:border-zinc-300 dark:hover:border-[#555] shadow-sm dark:shadow-none transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-900 dark:text-white">{app.role || 'Unknown Role'}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{app.company || 'Unknown Company'}</p>
                                </div>
                                <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                    {app.status || 'Applied'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-[10px] text-zinc-500">
                                    {new Date(app.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {app.link && (
                                    <a
                                        href={app.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                                    >
                                        View Job
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DashboardTab;
