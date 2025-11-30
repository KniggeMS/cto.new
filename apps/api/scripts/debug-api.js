const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }
    const client = new GoogleGenAI({ apiKey });

    try {
        console.log("Attempting to list models...");
        // Note: The SDK might not have a direct listModels on the client root depending on version,
        // but let's try the standard way or fallback to a known model check.
        // The google-genai package (v0.x) is new. Let's try to just hit a model and print the error in detail.

        // Actually, for the new SDK, we might not have a list method easily accessible without looking at docs.
        // Let's try a different approach: Try a very standard legacy model 'gemini-pro' specifically again,
        // but this time print the FULL error JSON.

        const response = await client.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: 'Test'
        });
        console.log("Success!");
    } catch (error) {
        console.error("Error Details:");
        console.error(JSON.stringify(error, null, 2));
        if (error.response) {
            console.error("Response Body:", await error.response.text());
        }
    }
}

listModels();
