import { callGemini } from './gemini';

export const generateCoverLetter = async (jobDescription, profile, apiKey) => {
    const prompt = `
You are an expert career coach and cover letter writer.
Based on the following user profile and job description, write a professional, tailored cover letter.
Do NOT include generic placeholders like "[Company Name]" where the information is clearly missing, just write around it or use generic terms like "your company".
Keep it to 3-4 concise paragraphs. Focus strictly on matching their skills to the job description requirements.

User Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription.substring(0, 4000)} // Truncated for safety

Return ONLY the cover letter text, no conversational filler or markdown code blocks.`;

    const result = await callGemini(prompt, apiKey, { temperature: 0.7, maxOutputTokens: 800 });

    if (!result.success) {
        return { error: result.error };
    }

    return { text: result.result };
};

export const analyzeJobFit = async (jobDescription, profile, apiKey) => {
    const prompt = `
You are an expert technical recruiter analyzing a job description against a candidate's profile.
Analyze the fit between the user and the job.

User Profile:
${JSON.stringify(profile, null, 2)}

Job Description:
${jobDescription.substring(0, 4000)}

Output the result STRICTLY as a JSON object, exactly like this:
{
  "match_score": 85,
  "red_flags": ["Requires 5 days onsite", "Wants 10 years experience, candidate has 3"]
}
If there are no red flags, return an empty array. Do not include markdown codeblocks (\`\`\`json). Just the JSON string.
`;

    const result = await callGemini(prompt, apiKey, { temperature: 0.1, maxOutputTokens: 500 });

    if (!result.success) {
        return { error: result.error };
    }

    try {
        // Strip out potential markdown formatting Gemini might sneak in
        let jsonStr = result.result.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        return {
            match_score: parsed.match_score || null,
            red_flags: parsed.red_flags || []
        };
    } catch (e) {
        console.error("Failed to parse Gemini Job Analysis JSON", e);
        return { error: 'Failed to parse JSON response from Gemini', raw: result.result };
    }
};
