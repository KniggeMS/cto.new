const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }
    const client = new GoogleGenAI({ apiKey });

    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-001',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro',
        'gemini-1.5-pro-001',
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-1.0-pro',
        'models/gemini-1.5-flash'
    ];

    console.log("Starting Exhaustive Model Test...");

    for (const model of models) {
        try {
            process.stdout.write(`Testing ${model}... `);
            // Try simple text generation
            await client.models.generateContent({
                model: model,
                contents: 'Hello'
            });
            console.log("SUCCESS");
        } catch (e) {
            console.log(`FAILED (${e.status || e.message})`);
        }
    }
    console.log("Test Complete.");
}

test();
