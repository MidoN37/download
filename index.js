const express = require('express');
const axios = require('axios');
const app = express();

const RD_API_KEY = "XP3FCTDMJJR3XCE2MRY6S77SGLVVWCZYDOWN44MFYDLG3T4RCSNQ"; 
const MANIFEST_URL = "https://raw.githubusercontent.com/MidoN37/download/master/manifest.json";
const RENDER_URL = "https://download-dr45.onrender.com";

app.get('/', (req, res) => res.send('Bridge Active.'));

app.get('/games.json', async (req, res) => {
    try {
        const response = await axios.get(MANIFEST_URL);
        const rawData = response.data;
        const fpkgiData = { "DATA": {} };

        rawData.forEach((item, index) => {
            const proxyUrl = `${RENDER_URL}/dl/${index}/game.pkg`;
            
            let titleId = "CUSA00000";
            try {
                const version = item.versions[0].version_name;
                const match = version.match(/CUSA\d+/);
                if (match) titleId = match[0];
            } catch(e) {}

            // EVERYTHING MUST BE A STRING
            fpkgiData["DATA"][proxyUrl] = {
                "title_id": String(titleId),
                "region": "USA",
                "name": String(item.title),
                "version": "01.00",
                "release": "11-15-2014",
                "size": "1000000000", // Must be in quotes
                "min_fw": "null",
                "cover_url": "null"
            };
        });

        res.json(fpkgiData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
            res.redirect(rdResponse.data.download);
        } else {
            res.status(500).send("RD Fail");
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
