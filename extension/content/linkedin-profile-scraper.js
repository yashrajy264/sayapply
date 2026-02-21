const autoScrollPage = async () => {
    return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            // Give it a brief moment to trigger lazy loads
            if (totalHeight >= scrollHeight) {
                clearInterval(timer);
                // Scroll back to top so user isn't left at the bottom
                window.scrollTo(0, 0);
                // Extra buffer to ensure React finishes mounting the components we just scrolled past
                setTimeout(resolve, 1000);
            }
        }, 100); // Fast scroll down
    });
};

const expandAllSections = async () => {
    // First, scroll to force DOM nodes to exist
    await autoScrollPage();

    // LinkedIn often hides experience description and other details behind "see more" buttons
    // The classes change, but common ones are:
    const expandButtons = document.querySelectorAll(`
        button.inline-show-more-text__button, 
        button.pv-profile-section__see-more-inline,
        button.pvs-list__bottom-action
    `);

    // Click buttons that contain text like "more", "see all", "show all"
    let clicked = false;
    expandButtons.forEach(btn => {
        const text = btn.innerText.toLowerCase();
        if (text.includes('more') || text.includes('see all') || text.includes('show all')) {
            try {
                btn.click();
                clicked = true;
            } catch (e) {
                console.warn('Say Apply Scraper: Failed to click an expand button', e);
            }
        }
    });

    // Wait a brief moment for the DOM to update with expanded text
    if (clicked) {
        await new Promise(resolve => setTimeout(resolve, 800));
    }
};

const scrapeLinkedInProfile = async () => {
    const profile = {};

    try {
        // Expand hidden text first
        await expandAllSections();

        // Name
        const nameEl = document.querySelector('h1.text-heading-xlarge') ||
            document.querySelector('h1') ||
            document.querySelector('.text-heading-xlarge');
        if (nameEl) profile.name = nameEl.innerText.trim();

        // Headline
        const headlineEl = document.querySelector('.text-body-medium.break-words') ||
            document.querySelector('[data-generated-suggestion-target]') ||
            document.querySelector('.pv-text-details__left-panel .text-body-medium');
        if (headlineEl) profile.headline = headlineEl.innerText.trim();

        // About
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            const aboutContainer = aboutSection.closest('section');
            if (aboutContainer) {
                const textElements = aboutContainer.querySelectorAll('.display-flex .visually-hidden, span[aria-hidden="true"]');
                if (textElements.length > 0) {
                    profile.about = Array.from(textElements).map(el => el.innerText).join('\n').trim();
                } else {
                    profile.about = aboutContainer.innerText.replace('About', '').trim();
                }
            }
        }

        // Generic section scraper helper
        const scrapeSection = (sectionId) => {
            const section = document.getElementById(sectionId);
            if (!section) return null;

            const container = section.closest('section');
            if (!container) return null;

            // Try to extract just the text content from the list items, ignoring the UI buttons
            const items = container.querySelectorAll('.pvs-list__item--line-separated, .artdeco-list__item');
            if (items.length > 0) {
                return Array.from(items).map(item => {
                    // Extract text, remove typical visually hidden screen reader duplicates
                    const spans = item.querySelectorAll('span[aria-hidden="true"]');
                    if (spans.length > 0) {
                        return Array.from(spans).map(s => s.innerText.trim()).filter(Boolean).join('\n');
                    }
                    return item.innerText.trim();
                }).join('\n\n');
            }

            // Fallback to dumping the whole section text if distinct items aren't found
            return container.innerText.trim();
        };

        // Experience
        profile.experienceRaw = scrapeSection('experience');

        // Education
        profile.educationRaw = scrapeSection('education');

        // Skills
        const skillsSection = document.getElementById('skills');
        if (skillsSection) {
            const skillsContainer = skillsSection.closest('section');
            if (skillsContainer) {
                const skillSpans = skillsContainer.querySelectorAll('.artdeco-pill span[aria-hidden="true"], .pvs-list__item--with-top-padding span[aria-hidden="true"]');
                if (skillSpans.length > 0) {
                    profile.skills = Array.from(skillSpans).map(s => s.innerText.trim()).filter(Boolean);
                } else {
                    // Use new helper
                    profile.skillsRaw = scrapeSection('skills');
                }
            }
        }
    } catch (error) {
        console.error("Say Apply Scraper: Error scraping profile data", error);
    }

    return profile;
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_PROFILE') {
        console.log("Say Apply Scraper: Received SCRAPE_PROFILE message");
        // Must return true synchronously and call sendResponse asynchronously
        scrapeLinkedInProfile()
            .then(data => {
                console.log("Say Apply Scraper: Scraped data:", data);
                sendResponse({ success: true, data });
            })
            .catch(e => {
                console.error("Say Apply Scraper: Error in listener", e);
                sendResponse({ success: false, error: e.message });
            });
        return true;
    }
});

