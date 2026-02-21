import { generateSemanticDOM } from './dom-parser';
import { fillField } from './form-filler';
import { getProfile, getSettings } from '../utils/storage';
import { findAnswer, saveAnswer } from '../utils/question-bank';
import { sleep, buildGeminiPrompt } from '../utils/helpers';
import { initializeTracker } from './tracker-intercept';
import { initializeMicroPrompts } from './micro-prompt';

let sessionSettings = {};
let userProfile = {};
let currentJobDescription = '';
let isRunning = false;
let platform = null;

initializeTracker();
initializeMicroPrompts();

if (window.location.hostname.includes('boards.greenhouse.io') || window.location.pathname.includes('greenhouse')) {
    platform = 'greenhouse';
} else if (window.location.hostname.includes('jobs.lever.co') || window.location.pathname.includes('lever')) {
    platform = 'lever';
} else if (window.location.hostname.includes('myworkdayjobs.com') || window.location.pathname.includes('workday')) {
    platform = 'workday';
} else {
    // Universal fallback
    platform = 'universal';
}

console.log(`Say Apply: Detected platform ${platform}`);

async function startPlatformApplication() {
    if (isRunning) return;
    isRunning = true;

    sessionSettings = await getSettings();
    userProfile = await getProfile();
    currentJobDescription = document.body.innerText.substring(0, 5000);

    // 1. Parse Semantic DOM
    const { fieldsData, fieldMap } = generateSemanticDOM(document.body);
    console.log('Detected Semantic Fields:', fieldsData);

    if (fieldsData.length === 0) {
        alert("Say Apply: Couldn't find any form fields on this page.");
        isRunning = false;
        return;
    }

    const fieldsToAskGemini = [];
    const answersMap = new Map();

    // 2. Check Question Bank and Dealbreakers first
    for (const field of fieldsData) {
        if (field.isAlreadyFilled) continue;

        let answered = false;

        // Question Bank
        if (field.label) {
            const saved = await findAnswer(field.label);
            if (saved) {
                answersMap.set(field.id, saved.answer);
                answered = true;
            }
        }

        // Dealbreakers fallback if no Question Bank match
        if (!answered && field.label) {
            const lbl = field.label.toLowerCase();
            if ((lbl.includes('salary') || lbl.includes('compensation') || lbl.includes('pay')) && userProfile.expectedSalary) {
                answersMap.set(field.id, userProfile.expectedSalary);
                answered = true;
            } else if (lbl.includes('relocat') && userProfile.relocate) {
                answersMap.set(field.id, userProfile.relocate);
                answered = true;
            } else if ((lbl.includes('sponsor') || lbl.includes('visa') || lbl.includes('auth')) && userProfile.sponsorship) {
                answersMap.set(field.id, userProfile.sponsorship);
                answered = true;
            }
        }

        // If not answered, queue for Gemini
        if (!answered) {
            fieldsToAskGemini.push(field);
        }
    }

    // 3. Batch Ask Gemini
    if (fieldsToAskGemini.length > 0) {
        // We only send a subset of data to save tokens
        const promptPayload = fieldsToAskGemini.map(f => ({
            id: f.id,
            label: f.label,
            context: f.context,
            type: f.type,
            options: f.options
        }));

        const prompt = buildGeminiPrompt('batch_mapping', userProfile, promptPayload, '', null, currentJobDescription);

        const response = await chrome.runtime.sendMessage({
            type: 'GEMINI_REQUEST',
            prompt: prompt
        });

        if (response.success && response.result !== 'UNKNOWN') {
            try {
                // Ensure the response is valid JSON
                let resultText = response.result;
                if (resultText.startsWith('```json')) {
                    resultText = resultText.replace(/```json/g, '').replace(/```/g, '');
                }
                const generatedAnswers = JSON.parse(resultText);

                // Merge answers and save to question bank
                for (const [key, val] of Object.entries(generatedAnswers)) {
                    if (val && val.trim() !== '') {
                        answersMap.set(key, val);
                        const fieldDef = fieldsToAskGemini.find(f => f.id === key);
                        if (fieldDef && fieldDef.label) {
                            // save async
                            saveAnswer(fieldDef.label, fieldDef.type, fieldDef.options, val, 'gemini').catch(e => console.error("Error saving to bank:", e));
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to parse Gemini batch response", e, response.result);
            }
        }
    }

    // 4. Actuation (Typing/Selecting)
    for (const field of fieldsData) {
        if (field.isAlreadyFilled) continue;

        const answer = answersMap.get(field.id);
        if (answer) {
            const element = fieldMap.get(field.id);
            if (element) {
                try {
                    await fillField({ element, fieldType: field.type }, String(answer));
                    await sleep(sessionSettings.minDelayBetweenFields_ms || 200, sessionSettings.maxDelayBetweenFields_ms || 600);
                } catch (e) {
                    console.error(`Failed to fill field ${field.label || field.id}`, e);
                }
            }
        }
    }

    alert("Say Apply: Form processing complete. Review your answers and submit manually.");
    isRunning = false;
}
