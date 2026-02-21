import { NextResponse } from 'next/server';

// Simple in-memory store for rate limiting (Note: in production across multiple instances, use Redis)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

export async function OPTIONS() {
    // Handle CORS preflight requests from the Chrome Extension
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*'); // Or restrict to chrome-extension://[id]
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
}

export async function POST(req: Request) {
    try {
        // 1. Basic Rate Limiting by IP (or extract extension user ID if provided)
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        const now = Date.now();

        if (rateLimitMap.has(ip)) {
            const userData = rateLimitMap.get(ip);
            // Reset window if passed
            if (now - userData.startTime > RATE_LIMIT_WINDOW_MS) {
                rateLimitMap.set(ip, { count: 1, startTime: now });
            } else {
                userData.count++;
                if (userData.count > MAX_REQUESTS_PER_WINDOW) {
                    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
                        status: 429,
                        headers: { 'Access-Control-Allow-Origin': '*' }
                    });
                }
                rateLimitMap.set(ip, userData);
            }
        } else {
            rateLimitMap.set(ip, { count: 1, startTime: now });
        }

        // 2. Parse Request
        const body = await req.json();
        const { prompt, temperature = 0.7 } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, {
                status: 400,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 3. Fetch Gemini using Server-Side Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not configured on the server.");
            return NextResponse.json({ error: 'Server configuration error' }, {
                status: 500,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiPayload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: 2048,
            }
        };

        const googleResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            throw new Error(`Google API responded with ${googleResponse.status}: ${errorText}`);
        }

        const data = await googleResponse.json();
        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResult) {
            throw new Error("Unexpected response structure from Gemini API");
        }

        // 4. Return successful response with CORS headers
        return NextResponse.json({ success: true, result: textResult }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error: any) {
        console.error('API Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}
