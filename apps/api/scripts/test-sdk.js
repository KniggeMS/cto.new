const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }
    console.log("Using API Key:", apiKey.substring(0, 5) + "...");

    const client = new GoogleGenAI({ apiKey });

    try {
        console.log("Listing models...");
        const response = await client.models.list();
        console.log("Available models:");
        response.models.forEach(m => console.log(`- ${m.name}`));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

test();
