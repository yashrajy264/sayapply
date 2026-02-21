// Scraper adapters for various platforms

function scrapeLinkedInJobs() {
    const jobs = [];
    // LinkedIn search results usually have job cards in a list
    const jobCards = document.querySelectorAll('.job-search-card, .scaffold-layout__list-item, .jobs-search-results__list-item');

    // Limit to max 15 jobs for scoring to save tokens and time
    const iterCards = Array.from(jobCards).slice(0, 15);

    iterCards.forEach(card => {
        const titleEl = card.querySelector('.base-search-card__title, .job-card-list__title');
        const companyEl = card.querySelector('.base-search-card__subtitle, .job-card-container__primary-description');
        const locationEl = card.querySelector('.job-search-card__location, .job-card-container__metadata-item');
        const linkEl = card.querySelector('a.base-card__full-link, a.job-card-list__title, a.job-card-container__link');

        if (titleEl && companyEl) {
            jobs.push({
                title: titleEl.innerText.trim(),
                company: companyEl.innerText.trim(),
                location: locationEl ? locationEl.innerText.trim() : 'Unknown',
                snippet: card.innerText.trim().substring(0, 300), // Get all visible text on the card as context
                url: linkEl ? linkEl.href : window.location.href.split('?')[0]
            });
        }
    });

    return jobs;
}

function scrapeWellfoundJobs() {
    const jobs = [];
    // Wellfound job cards
    const jobCards = document.querySelectorAll('.styles_component__U_lE_, .styles_jobListing__pB_iZ');

    const iterCards = Array.from(jobCards).slice(0, 15);

    iterCards.forEach(card => {
        const titleEl = card.querySelector('.styles_title__p1nJ_, h2');
        const companyEl = card.querySelector('.styles_name__yZ2Y_, h1, .styles_companyName__U_lE_');
        const locationEl = card.querySelector('.styles_location__U_lE_, .styles_details__U_lE_');
        const linkEl = card.querySelector('a'); // First link is usually the job or company

        if (titleEl) {
            jobs.push({
                title: titleEl.innerText.trim(),
                company: companyEl ? companyEl.innerText.trim() : 'Unknown Company',
                location: locationEl ? locationEl.innerText.trim() : 'Unknown',
                snippet: card.innerText.trim().substring(0, 300),
                url: linkEl ? linkEl.href : window.location.href
            });
        }
    });

    return jobs;
}

function scrapeInstahireJobs() {
    const jobs = [];
    const jobCards = document.querySelectorAll('.employer-block');

    const iterCards = Array.from(jobCards).slice(0, 15);

    iterCards.forEach(card => {
        const titleEl = card.querySelector('.job-title');
        const companyEl = card.querySelector('.company-name');
        const locationEl = card.querySelector('.location');
        const linkEl = card.querySelector('a');

        if (titleEl && companyEl) {
            jobs.push({
                title: titleEl.innerText.trim(),
                company: companyEl.innerText.trim(),
                location: locationEl ? locationEl.innerText.trim() : 'Unknown',
                snippet: card.innerText.trim().substring(0, 300),
                url: linkEl ? linkEl.href : window.location.href
            });
        }
    });

    return jobs;
}

function scrapeGenericJobs() {
    // If not a recognized platform, try to find generic job-like structures
    const jobs = [];
    // Just a fallback: get all links that might be jobs
    const links = document.querySelectorAll('a');
    let count = 0;

    links.forEach(link => {
        const text = link.innerText.trim();
        const href = link.href.toLowerCase();

        if (text.length > 5 && count < 10 && (href.includes('job') || href.includes('career') || href.includes('role'))) {
            jobs.push({
                title: text.substring(0, 100),
                company: window.location.hostname,
                location: 'Unknown',
                snippet: link.parentElement?.innerText.substring(0, 200) || text,
                url: link.href
            });
            count++;
        }
    });

    return jobs;
}

export function scrapeJobs() {
    const hostname = window.location.hostname;
    let jobs = [];

    if (hostname.includes('linkedin.com')) {
        jobs = scrapeLinkedInJobs();
    } else if (hostname.includes('wellfound.com')) {
        jobs = scrapeWellfoundJobs();
    } else if (hostname.includes('instahyre.com')) {
        jobs = scrapeInstahireJobs();
    } else {
        jobs = scrapeGenericJobs();
    }

    return jobs;
}

// Listen for scrape requests from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_AND_SCORE_JOBS') {
        const scrapedJobs = scrapeJobs();
        console.log("Scraped jobs:", scrapedJobs);

        if (scrapedJobs.length === 0) {
            chrome.runtime.sendMessage({ type: 'SCRAPED_JOBS_RESULTS', payload: [] });
            sendResponse({ success: true, count: 0 });
            return true;
        }

        // Send to background for AI scoring
        chrome.runtime.sendMessage({
            type: 'SCORE_JOBS_BATCH',
            payload: scrapedJobs
        });

        sendResponse({ success: true, count: scrapedJobs.length });
    }
    return true;
});
