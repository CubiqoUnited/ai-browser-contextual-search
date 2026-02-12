const fetch = require('node-fetch');

async function testSearch(query) {
    console.log(`[TEST] Searching for: "${query}"`);
    try {
        const response = await fetch('http://localhost:3000/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            console.error(`[FAIL] Status: ${response.status}`);
            const text = await response.text();
            console.error(text);
            return;
        }

        const data = await response.json();
        console.log('[SUCCESS] Data received:');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('[ERROR]', err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.log('TIP: Ensure the backend is running with "npm start" or similar.');
        }
    }
}

// Simple logic to trigger a test
const query = process.argv[2] || 'latest AI news';
testSearch(query);
