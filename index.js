const express = require('express');
const axios = require('axios');
const app = express();

// --- CONFIG ---
const RD_API_KEY = "XP3FCTDMJJR3XCE2MRY6S77SGLVVWCZYDOWN44MFYDLG3T4RCSNQ"; 
const MANIFEST_URL = "https://raw.githubusercontent.com/MidoN37/download/master/manifest.json";
const RENDER_URL = "https://download-dr45.onrender.com";

app.get('/', (req, res) => res.send('Bridge Active.'));

// 1. Convert GitHub manifest to FPKGi format
app.get('/games.json', async (req, res) => {
    try {
        const response = await axios.get(MANIFEST_URL);
        const rawData = response.data;
        const fpkgiData = { "DATA": {} };

        rawData.forEach((item, index) => {
            // Hardcoded URL with .pkg extension
            const proxyUrl = `${RENDER_URL}/dl/${index}/game.pkg`;
            
            fpkgiData["DATA"][proxyUrl] = {
                "name": item.title,
                "region": "USA",
                "version": "1.00",
                "release": "2024",
                "size": 1000000000, // 1GB in bytes (Integer)
                "min_fw": "5.05",
                "cover_url": null
            };
        });

        res.json(fpkgiData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. The Download Redirector (RD Bridge)
app.get('/dl/:id/:filename', async (req, res) => {
    try {
        const response = await axios.get(MANIFEST_URL);
        const game = response.data[req.params.id];
        const oneFichierUrl = game.versions[0].downloads[0].url;

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
            res.status(500).send("Real-Debrid failed to unrestrict.");
        }
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
