const fs = require('fs');
const path = require('path');
const http = require('http');

const imagePath = 'C:/Users/Admin/.gemini/antigravity/brain/cf8c30c5-b0ed-4f81-a540-25a3616ebf26/uploaded_image_1764498231161.png';

try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const data = JSON.stringify({
        image: `data:image/png;base64,${base64Image}`
    });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/ai/vision',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(data);
    req.end();

} catch (err) {
    console.error('Error reading file:', err);
}
