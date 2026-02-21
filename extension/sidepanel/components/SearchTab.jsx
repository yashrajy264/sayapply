import React, { useState, useEffect } from 'react';
import { SUPPORTED_PLATFORMS, getSearchUrl } from '../../utils/platform-urls';

const SearchTab = () => {
    const [jobTitle, setJobTitle] = useState('');
    const [location, setLocation] = useState('');
    const [activePlatform, setActivePlatform] = useState('linkedin');
    const [detectedPlatform, setDetectedPlatform] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        // Detect current platform on load
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const url = tabs[0].url;
                if (url.includes('linkedin.com')) {
                    setDetectedPlatform('linkedin');
                    setActivePlatform('linkedin');
                } else if (url.includes('wellfound.com')) {
                    setDetectedPlatform('wellfound');
                    setActivePlatform('wellfound');
                } else if (url.includes('instahyre.com')) {
                    setDetectedPlatform('instahire');
                    setActivePlatform('instahire');
                } else {
                    setDetectedPlatform(null);
                }
            }
        });

        // Listen for scraped jobs
        const messageListener = (message) => {
            if (message.type === 'SCRAPED_JOBS_RESULTS') {
                setIsAnalyzing(false);
                if (message.payload && message.payload.length > 0) {
                    setJobs(message.payload);
                } else {
                    alert("No jobs found to analyze or an error occurred.");
                }
            }
        };
        chrome.runtime.onMessage.addListener(messageListener);
        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);

    const handleSearch = () => {
        if (!jobTitle) return;

        const url = getSearchUrl(activePlatform, jobTitle, location);

        // Navigate the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.update(tabs[0].id, { url: url });
        });
    };

    const handleAnalyzeJobs = () => {
        setIsAnalyzing(true);
        setJobs([]);
        // Send message to active tab to trigger scraping adapter
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SCRAPE_AND_SCORE_JOBS' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Content script not ready or error:", chrome.runtime.lastError.message);
                        setIsAnalyzing(false);
                        alert("Say Apply: Content script not loaded. Try refreshing the page.");
                    }
                });
            }
        });
    };

    const [outreachData, setOutreachData] = useState(null);
    const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

    const handleGenerateOutreach = (e, job) => {
        e.stopPropagation(); // Don't trigger the job URL navigation
        setIsGeneratingOutreach(true);
        setOutreachData(null);

        chrome.runtime.sendMessage({
            type: 'GENERATE_OUTREACH',
            payload: { title: job.title, company: job.company, snippet: job.snippet }
        }, (response) => {
            setIsGeneratingOutreach(false);
            if (response && response.success) {
                setOutreachData(response.result);
            } else {
                alert("Failed to generate outreach: " + (response?.error || "Unknown error"));
            }
        });
    };

    return (
        <div className="flex flex-col gap-4 h-full relative">
            {/* Outreach Modal */}
            {(outreachData || isGeneratingOutreach) && (
                <div className="absolute inset-0 z-50 bg-white/95 dark:bg-black/95 flex flex-col p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <span>✨</span> Outreach Assistant
                        </h3>
                        <button
                            onClick={() => { setOutreachData(null); setIsGeneratingOutreach(false); }}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            ✕
                        </button>
                    </div>

                    {isGeneratingOutreach ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <div className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-zinc-500">Drafting personalized messages...</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase">LinkedIn Invite</label>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(outreachData.linkedin); alert("Copied!"); }}
                                        className="text-[10px] text-[#10b981] font-bold hover:underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-[#111] border border-zinc-200 dark:border-[#333] rounded-lg text-xs leading-relaxed">
                                    {outreachData.linkedin}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase">Professional Email</label>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(outreachData.email); alert("Copied!"); }}
                                        className="text-[10px] text-[#10b981] font-bold hover:underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-[#111] border border-zinc-200 dark:border-[#333] rounded-lg text-xs leading-relaxed">
                                    {outreachData.email}
                                </div>
                            </div>

                            <p className="text-[10px] text-zinc-400 text-center mt-2 italic">
                                Tip: Personalize these further with the manager's name!
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-[#333] p-4 shadow-sm">
                <h2 className="text-sm font-semibold mb-3">Job Discovery</h2>

                {detectedPlatform && (
                    <div className="mb-3 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-md inline-block">
                        📍 Detected Portal: {SUPPORTED_PLATFORMS.find(p => p.id === detectedPlatform)?.name}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">Platform</label>
                        <div className="flex gap-2">
                            {SUPPORTED_PLATFORMS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePlatform(p.id)}
                                    className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${activePlatform === p.id
                                        ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black'
                                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-[#222] dark:border-[#444] dark:text-zinc-400 dark:hover:bg-[#333]'}`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">Job Title / Keywords</label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Frontend React Engineer"
                            className="w-full text-sm px-3 py-2 bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-shadow"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-zinc-500 mb-1 block">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Remote, San Francisco"
                            className="w-full text-sm px-3 py-2 bg-zinc-50 dark:bg-[#0f0f0f] border border-zinc-200 dark:border-[#333] rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-shadow"
                        />
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={!jobTitle}
                        className="w-full py-2 bg-[#10b981] text-white text-sm font-semibold rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                    >
                        Search on {SUPPORTED_PLATFORMS.find(p => p.id === activePlatform)?.name}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#171717] rounded-xl border border-zinc-200 dark:border-[#333] p-4 shadow-sm flex-1 overflow-visible pb-20">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold">AI Match Scoring</h2>
                    <button
                        onClick={handleAnalyzeJobs}
                        disabled={isAnalyzing}
                        className="text-xs px-2 py-1 bg-zinc-100 object-center dark:bg-[#333] rounded hover:bg-zinc-200 dark:hover:bg-[#444] transition-colors disabled:opacity-50"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Page'}
                    </button>
                </div>

                {isAnalyzing && (
                    <div className="text-xs text-zinc-500 text-center py-4 animate-pulse">
                        Gemini is reading jobs and calculating compatibility...
                    </div>
                )}

                {!isAnalyzing && jobs.length === 0 && (
                    <div className="text-xs text-zinc-500 text-center py-4">
                        Run a search, then click "Analyze Page" to score the visible jobs against your profile.
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {jobs.map((job, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 dark:bg-[#0f0f0f] rounded-lg border border-zinc-200 dark:border-[#333] cursor-pointer hover:border-[#10b981] transition-colors group relative"
                            onClick={() => {
                                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                    chrome.tabs.update(tabs[0].id, { url: job.url });
                                });
                            }}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-xs font-bold text-[#10b981] group-hover:underline flex-1 pr-2 line-clamp-2">{job.title}</h3>
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${job.score >= 80 ? 'bg-green-100 text-green-700' : job.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {job.score}%
                                </div>
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mb-2">
                                {job.company} • {job.location || 'Remote'}
                            </div>
                            <div className="text-[10px] text-zinc-600 dark:text-zinc-300 italic mb-2 line-clamp-2">
                                "{job.reason}"
                            </div>

                            <div className="flex justify-end pt-1 border-t border-zinc-100 dark:border-[#222] mt-1">
                                <button
                                    onClick={(e) => handleGenerateOutreach(e, job)}
                                    className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#10b981] flex items-center gap-1 py-1 px-2 rounded hover:bg-[#10b981]/10 transition-colors"
                                >
                                    <span>📨</span> Draft Outreach
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchTab;
