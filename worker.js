const { Worker } = require("bullmq");
const Redis = require("ioredis");
const mammoth = require("mammoth");
const fs = require("fs");
const slugify = require("slugify");
const axios = require("axios");

const connection = new Redis();

const worker = new Worker("articleQueue", async job => {
    const { filePath } = job.data;

    const result = await mammoth.convertToHtml({ path: file.path });
const html = result.value;

// Extract paragraphs properly
const paragraphs = html.split('</p>');

// Get title from FIRST paragraph
let title = paragraphs[0]
    .replace(/<[^>]*>/g, '')   // remove HTML tags
    .trim()
    .substring(0, 100);

// Generate clean slug
const slug = slugify(title, { lower: true, strict: true }) + "-" + Date.now();

// Keep full content as HTML
const content = html;

const articleData = {
    title,
    slug,
    content
};

    await publishToWebflow(articleData);

    fs.unlinkSync(filePath);
}, { connection });

async function publishToWebflow(data) {
    const response = await axios.post(
        `https://api.webflow.com/collections/${process.env.COLLECTION_ID}/items`,
        {
            fields: {
                name: data.title,
                slug: data.slug,
                "post-body": data.content,
                _archived: false,
                _draft: false
            }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WEBFLOW_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    console.log("Published:", response.data);
}