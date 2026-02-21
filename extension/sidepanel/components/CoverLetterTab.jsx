import React, { useState, useEffect } from 'react';
import { generateCoverLetter } from '../../utils/api';

const CoverLetterTab = () => {
    const [jobDescription, setJobDescription] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load profile data and API key
        chrome.storage.local.get(['profile', 'apiKey'], (result) => {
            setProfileData({
                profile: result.profile,
                apiKey: result.apiKey
            });
        });
    }, []);

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            setError('Please paste a job description first.');
            return;
        }

        if (!profileData?.apiKey) {
            setError('Please add your Gemini API Key in Settings first.');
            return;
        }

        if (!profileData?.profile) {
            setError('Please fill out your Profile first.');
            return;
        }

        setError(null);
        setIsGenerating(true);

        try {
            const result = await generateCoverLetter(
                jobDescription,
                profileData.profile,
                profileData.apiKey
            );

            if (result.error) {
                throw new Error(result.error);
            }

            setCoverLetter(result.text);

            // Save it to storage so it can be injected
            chrome.storage.local.set({ currentCoverLetter: result.text });

        } catch (err) {
            setError(err.message || 'Failed to generate cover letter');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        // Could add a small toast notification here
    };

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">Cover Letter Generator</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Generate a tailored cover letter using your profile and the job description.
                </p>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Input Section */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5 flex justify-between items-center">
                        Job Description
                        <button
                            onClick={() => setJobDescription('')}
                            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            Clear
                        </button>
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-[#333] rounded-lg p-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-500 dark:focus:border-white focus:ring-1 focus:ring-zinc-500 dark:focus:ring-white transition-all min-h-[120px]"
                        placeholder="Paste the job requirements and description here..."
                        disabled={isGenerating}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !jobDescription.trim()}
                    className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black font-medium py-2 px-4 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/50 dark:focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Generate Map
                        </>
                    )}
                </button>
            </div>

            {/* Output Section */}
            {coverLetter && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 flex justify-between items-center">
                        Generated Letter
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="text-xs text-zinc-700 bg-zinc-200 hover:bg-zinc-300 dark:text-white dark:bg-[#333] dark:hover:bg-[#444] px-2 py-1 rounded transition-colors"
                            >
                                Copy to Clipboard
                            </button>
                            <button
                                onClick={() => setCoverLetter('')}
                                className="text-xs text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                            >
                                Discard
                            </button>
                        </div>
                    </label>
                    <textarea
                        value={coverLetter}
                        onChange={(e) => {
                            setCoverLetter(e.target.value);
                            chrome.storage.local.set({ currentCoverLetter: e.target.value });
                        }}
                        className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-[#333] rounded-lg p-3 text-sm text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-zinc-500 dark:focus:border-white focus:ring-1 focus:ring-zinc-500 dark:focus:ring-white transition-all min-h-[300px]"
                    />
                </div>
            )}
        </div>
    );
};

export default CoverLetterTab;
