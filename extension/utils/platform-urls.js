export const SUPPORTED_PLATFORMS = [
    { id: 'linkedin', name: 'LinkedIn', icon: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },
    { id: 'wellfound', name: 'Wellfound', icon: 'M20.211 4.398c-.161-.258-.456-.4-.755-.371L2.094 5.922C1.794 5.952 1.5 6.096 1.34 6.353c-.159.256-.168.56-.032.825L8.434 21.46c.135.265.419.429.721.429.303 0 .586-.164.722-.429l10.366-20.233c.136-.264.126-.569-.032-.829zm-10.963 15.3l-5.66-10.957 7.027 13.784-1.367-2.827zm7.848-11.854L8.148 18.23l-3.238-6.273 12.186-4.113z' }, // placeholder icon
    { id: 'instahire', name: 'InstaHire', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' } // placeholder generic icon
];

export const getSearchUrl = (platformId, title, location) => {
    const encTitle = encodeURIComponent(title);
    const encLocation = encodeURIComponent(location);

    switch (platformId) {
        case 'linkedin':
            // For LinkedIn search
            return `https://www.linkedin.com/jobs/search/?keywords=${encTitle}&location=${encLocation}`;
        case 'wellfound':
            return `https://wellfound.com/jobs?search=${encTitle}%20${encLocation}`;
        case 'instahire':
            return `https://www.instahyre.com/job-search/?q=${encTitle}&loc=${encLocation}`;
        default:
            return `https://www.google.com/search?q=${encTitle}+jobs+in+${encLocation}`;
    }
};
