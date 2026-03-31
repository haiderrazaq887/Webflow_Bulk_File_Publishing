require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const fs = require('fs');
const slugify = require('slugify');
const axios = require('axios');

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ✅ FIXED PUBLISH FUNCTION WITH FULL ERROR LOG
async function publishToWebflow(data) {
    try {
        const response = await axios.post(
            `https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items`,
            {
                fieldData: {
                    name: data.title,
                    slug: data.slug,
                    "post-body": data.content
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ SUCCESS:", response.data);
    } catch (error) {
        console.error("❌ WEBFLOW ERROR FULL:");
        console.error(JSON.stringify(error.response?.data, null, 2));
    }
}

app.post('/upload', upload.array('files'), async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded');
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Processing file ${i + 1}/${files.length}: ${file.originalname}`);

        try {
            const result = await mammoth.convertToHtml({ path: file.path });
            const html = result.value;

            // ✅ FIX: Extract title from FIRST <p>
            const paragraphs = html.split('</p>');

            let title = paragraphs[0]
                .replace(/<[^>]*>/g, '')
                .trim()
                .substring(0, 80);

            if (!title) title = "Default Title";

            // ✅ FIX: Safe slug
            const slug = slugify(title, { lower: true, strict: true }) + "-" + Date.now();

            console.log("TITLE:", title);
            console.log("SLUG:", slug);

            const articleData = {
                title,
                slug,
                content: html
            };

            await publishToWebflow(articleData);

            await delay(500);

        } catch (err) {
            console.error("❌ PROCESS ERROR:", err.message);
        } finally {
            fs.unlinkSync(file.path);
        }
    }

    res.send('All files processed!');
});

app.get('/', (req, res) => {
    res.send(`
        <h2>Bulk Webflow Publisher</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="files" multiple>
            <button type="submit">Upload & Publish</button>
        </form>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});