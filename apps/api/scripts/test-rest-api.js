const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Testing URL: https://generativelanguage.googleapis.com/v1beta/models?key=HIDDEN`);

const req = https.get(url, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            console.log('AVAILABLE MODELS (supporting generateContent):');
            if (json.models) {
                let found = false;
                json.models.forEach(m => {
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${m.name}`);
                        found = true;
                    }
                });
                if (!found) console.log("No models support generateContent.");
            } else {
                console.log('No models found in response:', body);
            }
        } catch (e) {
            console.log('BODY:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});
