const axios = require("axios");

const API_KEY = "b58f4019434abfab45493c516e5ae383dc5b0e760e2107f0c3af1fddd5b8b5e0";

async function getCollections() {
    try {
        // Step 1: Get Sites
        const siteRes = await axios.get(
            "https://api.webflow.com/v2/sites",
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`
                }
            }
        );

        console.log("SITES:", siteRes.data);

        const siteId = siteRes.data.sites[0].id;

        // Step 2: Get Collections
        const colRes = await axios.get(
            `https://api.webflow.com/v2/sites/${siteId}/collections`,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`
                }
            }
        );

        console.log("COLLECTIONS:", colRes.data);

    } catch (err) {
        console.error("❌ ERROR:");
        console.error(err.response?.data || err.message);
    }
}

getCollections();