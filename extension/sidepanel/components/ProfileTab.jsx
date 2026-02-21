import React, { useState, useEffect } from 'react';
import { getProfile, saveProfile, getResumeBase64, saveResume } from '../../utils/storage';
import { fileToBase64 } from '../../utils/helpers';
import { toast } from 'sonner';

const ProfileTab = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    currentJobTitle: '',
    yearsOfExperience: 0,
    skills: [],
    education: '',
    linkedinUrl: '',
    portfolioUrl: '',
    githubUrl: '',
    workAuthorization: 'Indian Citizen',
    expectedSalary: '',
    noticePeriod: '',
    languages: [],
    professionalSummary: ''
  });

  const [resumeName, setResumeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await getProfile();
    if (p) setProfile(prev => ({ ...prev, ...p }));

    const r = await getResumeBase64();
    if (r && r.fileName) setResumeName(r.fileName);

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveProfile(profile);
    setTimeout(() => setSaving(false), 1000);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Invalid file type', { description: 'Only PDF files are allowed' });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      await saveResume(base64, file.name);
      setResumeName(file.name);
      toast.success('Resume uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload resume');
    }
  };

  const handleImportProfile = async () => {
    // Check if we are on a LinkedIn profile page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('linkedin.com/in/')) {
      toast.info('Navigation required', { description: 'Please go to your LinkedIn profile page first.' });
      return;
    }

    setLoading(true);
    toast.loading('Scraping profile data...', { id: 'import-toast' });
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PROFILE' });

      if (response && response.success) {
        const d = response.data || {};

        let importedFields = 0;
        if (d.name) importedFields++;
        if (d.headline) importedFields++;
        if (d.about) importedFields++;
        if (d.skills || d.skillsRaw) importedFields++;
        if (d.educationRaw) importedFields++;
        if (d.experienceRaw) importedFields++;

        if (importedFields === 0) {
          toast.error('No data found', { id: 'import-toast', description: 'Could not extract profile info. Please manually reload the extension or refresh the page.' });
          setLoading(false);
          return;
        }

        setProfile(prev => ({
          ...prev,
          fullName: d.name || prev.fullName,
          currentJobTitle: d.headline || prev.currentJobTitle,
          professionalSummary: d.about || prev.professionalSummary,
          skills: d.skills || prev.skills,
          // Education and Experience are raw text for now, user can refine
          education: d.educationRaw || prev.education,
          // We might want to parse yearsOfExperience from raw text in a real app
        }));

        toast.success('Profile imported!', { id: 'import-toast', description: 'Please review and save your details below.' });
      } else {
        console.warn("Import failed or no response", response);
        toast.error('Import failed', { id: 'import-toast', description: 'Make sure the LinkedIn page is fully loaded and you are on a profile.' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Import error', { id: 'import-toast', description: 'Ensure the extension is reloaded and the page is refreshed. ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-zinc-400">Loading profile...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Personal Info Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Personal Info</label>
          <button
            onClick={handleImportProfile}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Import from LinkedIn
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Full Name</span>
            <input
              type="text"
              name="fullName"
              placeholder="e.g. Alex Doe"
              value={profile.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Email</span>
            <input
              type="email"
              name="email"
              placeholder="alex@example.com"
              value={profile.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500 font-medium ml-1">Phone</span>
              <input
                type="tel"
                name="phone"
                placeholder="+1 234..."
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500 font-medium ml-1">Location</span>
              <input
                type="text"
                name="location"
                placeholder="City, Country"
                value={profile.location}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">LinkedIn URL</span>
            <input
              type="text"
              name="linkedinUrl"
              placeholder="https://linkedin.com/in/..."
              value={profile.linkedinUrl}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Professional Section */}
      <section className="space-y-4">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Professional</label>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Current Job Title</span>
            <input
              type="text"
              name="currentJobTitle"
              placeholder="Software Engineer"
              value={profile.currentJobTitle}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Years of Exp</span>
            <input
              type="number"
              name="yearsOfExperience"
              placeholder="5"
              value={profile.yearsOfExperience}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Education</span>
            <textarea
              name="education"
              placeholder="BS Computer Science, Stanford University, 2020"
              value={profile.education}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white resize-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Professional Summary</span>
            <textarea
              name="professionalSummary"
              placeholder="Experienced developer spealizing in React..."
              value={profile.professionalSummary}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white resize-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Dealbreakers Section */}
      <section className="space-y-4">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dealbreakers / Defaults</label>
        <p className="text-[10px] text-zinc-500 mb-2">Say Apply will use exact matching to answer these common questions to prevent AI hallucinations.</p>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-500 font-medium ml-1">Expected Salary (Numeric or Range)</span>
            <input
              type="text"
              name="expectedSalary"
              placeholder="$120,000"
              value={profile.expectedSalary}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 placeholder-zinc-500 dark:placeholder-zinc-600 text-zinc-900 dark:text-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500 font-medium ml-1">Willing to Relocate?</span>
              <select
                name="relocate"
                value={profile.relocate || 'No'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 text-zinc-900 dark:text-white transition-colors"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-500 font-medium ml-1">Require Visa Sponsorship?</span>
              <select
                name="sponsorship"
                value={profile.sponsorship || 'No'}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm bg-zinc-100 dark:bg-[#171717] rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-[#333] focus:ring-0 text-zinc-900 dark:text-white transition-colors"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Section */}
      <section className="space-y-4">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Resume</label>
        <div className="p-4 border border-dashed border-zinc-300 dark:border-[#333] rounded-lg hover:bg-zinc-100 dark:hover:bg-[#171717] transition-colors group cursor-pointer relative">
          <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleResumeUpload} />
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            {resumeName ? (
              <>
                <svg className="w-8 h-8 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-zinc-900 dark:text-white font-medium">{resumeName}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Click to replace</span>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">Upload Resume (PDF)</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-50/90 dark:bg-[#0f0f0f]/90 backdrop-blur-sm border-t border-zinc-200 dark:border-[#333] transition-colors">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all transform active:scale-95 ${saving ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-200'}`}
        >
          {saving ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;
