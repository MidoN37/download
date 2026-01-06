const express = require('express');
const axios = require('axios');
const app = express();

// --- CONFIG ---
const RD_API_KEY = "XP3FCTDMJJR3XCE2MRY6S77SGLVVWCZYDOWN44MFYDLG3T4RCSNQ"; // Replace with your key
const MANIFEST_URL = "https://raw.githubusercontent.com/MidoN37/download/master/manifest.json";

app.get('/', (req, res) => res.send('Bridge is active. Set FPKGi to use /games.json'));

// 1. Convert GitHub manifest to FPKGi format
app.get('/games.json', async (req, res) => {
    try {
        const response = await axios.get(MANIFEST_URL);
        const rawData = response.data;
        const fpkgiData = { "DATA": {} };

        // This automatically detects your Render URL
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.get('host');
        const baseUrl = `${protocol}://${host}`;

        rawData.forEach((item, index) => {
            const proxyUrl = `${baseUrl}/dl/${index}`;
            
            fpkgiData["DATA"][proxyUrl] = {
                "name": item.title,
                "region": "USA",
                "version": "1.00",
                "size": 1048576, // 1MB placeholder
                "release": "2024",
                "min_fw": "5.05",
                "cover_url": null
            };
        });

        res.json(fpkgiData);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch manifest", details: err.message });
    }
});

// 2. The Download Redirector (RD Bridge)
app.get('/dl/:id', async (req, res) => {
    try {
        const response = await axios.get(MANIFEST_URL);
        const game = response.data[req.params.id];
        
        // Grab the first 1fichier link from your manifest structure
        const oneFichierUrl = game.versions[0].downloads[0].url;

        // Unrestrict via Real-Debrid
        const params = new URLSearchParams();
        params.append('link', oneFichierUrl);

        const rdResponse = await axios.post(
            "https://api.real-debrid.com/rest/1.0/unrestrict/link",
            params,
            { headers: { "Authorization": `Bearer ${RD_API_KEY}` } }
        );

        if (rdResponse.data && rdResponse.data.download) {
            console.log(`Redirecting to: ${rdResponse.data.download}`);
            res.redirect(rdResponse.data.download);
        } else {
            res.status(500).send("Real-Debrid failed to unrestrict link.");
        }
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
