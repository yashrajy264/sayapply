const autoScrollPage = async () => {
    console.log("Say Apply: Auto-scrolling to hydrate content...");
    return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const maxScroll = 5000;
        const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            // Check if we've reached the bottom or a reasonable depth
            if (totalHeight >= scrollHeight || totalHeight >= maxScroll) {
                clearInterval(timer);
                window.scrollTo(0, 0);
                setTimeout(resolve, 800); // Give time for rendering
            }
        }, 150);
    });
};

const expandAllSections = async () => {
    console.log("Say Apply: Expanding profile sections...");
    await autoScrollPage();

    const expandSelectors = [
        '.inline-show-more-text__button',
        'button.pvs-list__bottom-action',
        'a.pvs-list__footer-action',
        '.pv-profile-section__see-more-inline',
        '.lt-line-clamp__more'
    ];

    // Try multiple rounds of expansion as clicking one might reveal another
    for (let round = 0; round < 2; round++) {
        const expandButtons = document.querySelectorAll(expandSelectors.join(', '));
        console.log(`Say Apply: Round ${round + 1}, found ${expandButtons.length} potential expand buttons`);

        for (const btn of expandButtons) {
            const text = btn.innerText.toLowerCase();
            const isExpandable = text.includes('more') ||
                text.includes('see all') ||
                text.includes('show all') ||
                text.includes('see more');

            if (isExpandable && btn.offsetParent !== null) { // Check if visible
                try {
                    btn.click();
                    // Small delay to allow expansion
                    await new Promise(r => setTimeout(r, 200));
                } catch (e) {
                    // Silently fail if button is detached
                }
            }
        }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
};

const scrapeLinkedInProfile = async () => {
    const profile = {};
    console.log("Say Apply: Starting profile scrape...");

    try {
        await expandAllSections();

        // 1. Name
        const nameSelectors = [
            'h1.text-heading-xlarge',
            'main h1',
            '.pv-text-details__left-panel h1',
            '.text-heading-xlarge',
            'h1'
        ];
        for (const s of nameSelectors) {
            const el = document.querySelector(s);
            if (el && el.innerText.trim() && !el.innerText.includes('\n')) {
                profile.name = el.innerText.trim();
                console.log(`Say Apply: Found name: "${profile.name}" using selector: "${s}"`);
                break;
            }
        }

        // 2. Headline
        const headlineSelectors = [
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            '[data-generated-suggestion-target]',
            'main .text-body-medium'
        ];
        for (const s of headlineSelectors) {
            const el = document.querySelector(s);
            if (el && el.innerText.trim()) {
                profile.headline = el.innerText.trim();
                console.log(`Say Apply: Found headline: "${profile.headline}" using selector: "${s}"`);
                break;
            }
        }

        // 3. About
        const aboutSelectors = ['#about', '[id="about"]', 'section.pv-about-section', '.pv-shared-text-with-see-more'];
        for (const s of aboutSelectors) {
            const el = document.querySelector(s);
            if (el) {
                // If it's a section, find the content inside
                const content = el.tagName === 'SECTION' ? el.querySelector('.display-flex.mt2') || el : el;
                const text = content.innerText.replace('About', '').trim();
                if (text.length > 10) {
                    profile.about = text;
                    console.log(`Say Apply: Found about using selector: "${s}"`);
                    break;
                }
            }
        }

        const scrapeSection = (id) => {
            console.log(`Say Apply: Attempting to scrape section "${id}"`);
            let section = document.getElementById(id) || document.querySelector(`[id="${id}"]`);

            if (section) {
                console.log(`Say Apply: Found section "${id}" by ID`);
            } else {
                console.log(`Say Apply: Section "${id}" not found by ID, trying H2 headers...`);
                const headers = Array.from(document.querySelectorAll('h2'));
                const targetHeader = headers.find(h => {
                    const text = h.innerText.toLowerCase();
                    return text === id.toLowerCase() ||
                        text.includes(`${id} `) ||
                        text.includes(` ${id}`) ||
                        (id === 'experience' && text.includes('work experience'));
                });
                if (targetHeader) {
                    console.log(`Say Apply: Found section "${id}" by H2 header: "${targetHeader.innerText}"`);
                    section = targetHeader.closest('section') || targetHeader.parentElement;
                }
            }

            // Third fallback: Look for specific LinkedIn section anchors
            if (!section) {
                console.log(`Say Apply: Section "${id}" not found by H2, trying anchors/aria-labels...`);
                const anchors = Array.from(document.querySelectorAll('div[id], section[id], a[name]'));
                const targetAnchor = anchors.find(a => (a.id || a.name || "").toLowerCase().includes(id.toLowerCase()));
                if (targetAnchor) {
                    console.log(`Say Apply: Found section "${id}" by anchor: "${targetAnchor.id || targetAnchor.name}"`);
                    section = targetAnchor.closest('section') || targetAnchor;
                }
            }

            if (!section) {
                console.warn(`Say Apply: Completely failed to find section "${id}" after all fallbacks.`);
                return null;
            }

            const container = section.tagName === 'SECTION' ? section : section.closest('section') || section;
            console.log(`Say Apply: Extracting items from container for "${id}"`);

            // Look for list items or nested text spans
            const itemSelectors = [
                '.pvs-list__item--line-separated',
                '.artdeco-list__item',
                '.pvs-entity',
                '.experience-item',
                'li.pvs-list__item'
            ];
            const items = container.querySelectorAll(itemSelectors.join(', '));

            if (items.length > 0) {
                console.log(`Say Apply: Found ${items.length} items in section "${id}"`);
                return Array.from(items).map(item => {
                    const spans = item.querySelectorAll('span[aria-hidden="true"]');
                    if (spans.length > 0) {
                        return Array.from(spans)
                            .map(s => s.innerText.trim())
                            .filter((val, index, self) => val && self.indexOf(val) === index) // Unique lines
                            .join('\n');
                    }
                    return item.innerText.replace(/\s+/g, ' ').trim();
                }).join('\n\n');
            }

            console.log(`Say Apply: No specific items found, returning raw text for section "${id}"`);
            return container.innerText.replace(id.charAt(0).toUpperCase() + id.slice(1), '').trim();
        };

        const scraperData = {
            ...profile,
            experienceRaw: scrapeSection('experience'),
            educationRaw: scrapeSection('education')
        };

        // 4. Skills
        console.log("Say Apply: Attempting to scrape Skills");
        let skillsSection = document.getElementById('skills');
        if (!skillsSection) {
            const h2s = Array.from(document.querySelectorAll('h2'));
            const skillsH2 = h2s.find(h => h.innerText.toLowerCase().includes('skills'));
            if (skillsH2) skillsSection = skillsH2.closest('section') || skillsH2;
        }

        if (skillsSection) {
            const container = skillsSection.tagName === 'SECTION' ? skillsSection : skillsSection.closest('section') || skillsSection;
            const skillEls = container.querySelectorAll('.pvs-list__item--line-separated span[aria-hidden="true"], .artdeco-pill span[aria-hidden="true"], .pv-skill-category-entity__name-text');
            if (skillEls.length > 0) {
                scraperData.skills = Array.from(new Set(Array.from(skillEls).map(s => s.innerText.trim()).filter(Boolean)));
                console.log(`Say Apply: Found ${scraperData.skills.length} skills`);
            } else {
                scraperData.skillsRaw = scrapeSection('skills');
            }
        }

        console.log("Say Apply: Scrape complete", scraperData);
        return scraperData;
    } catch (error) {
        console.error("Say Apply: Scraper error", error);
        throw error;
    }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPE_PROFILE') {
        scrapeLinkedInProfile()
            .then(data => sendResponse({ success: true, data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});

