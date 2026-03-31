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

// ✅ Helper route — visit /fields to see your exact field slugs
app.get('/fields', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const fields = response.data.fields.map(f => ({
            displayName: f.displayName,
            slug: f.slug,
            type: f.type,
            required: f.required
        }));

        res.json(fields);
    } catch (error) {
        res.status(500).json(error.response?.data);
    }
});

async function publishToWebflow(data) {
    const collectionId = process.env.COLLECTION_ID;

    try {
        // Step 1: Create the item
        // ⚠️ Replace "post-body" below with your actual Rich Text field slug from /fields
        const createRes = await axios.post(
            `https://api.webflow.com/v2/collections/${collectionId}/items`,
            {
                fieldData: {
                    name: data.title,
                    slug: data.slug,
                    "post-body": data.content   // ← change this if your slug is different
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const itemId = createRes.data.id;
        console.log("✅ Item created:", itemId);

        // Step 2: Publish the item
        const publishRes = await axios.post(
            `https://api.webflow.com/v2/collections/${collectionId}/items/publish`,
            {
                itemIds: [itemId]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("🚀 Published successfully:", publishRes.data);

    } catch (error) {
        console.error("❌ WEBFLOW ERROR:");
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

            const paragraphs = html.split('</p>');

            let title = paragraphs[0]
                .replace(/<[^>]*>/g, '')
                .trim()
                .substring(0, 80);

            if (!title) title = "Default Title";

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
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
    }

    res.send('All files processed!');
});

app.get('/', (req, res) => {
    res.send(`
        <h2>Bulk Webflow Publisher</h2>
        <p>Visit <a href="/fields">/fields</a> to check your exact field slugs</p>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="files" multiple accept=".docx">
            <button type="submit">Upload & Publish</button>
        </form>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Check field slugs at http://localhost:${PORT}/fields`);
});