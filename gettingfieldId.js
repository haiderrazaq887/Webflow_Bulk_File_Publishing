const axios = require("axios");

const API_KEY = "b58f4019434abfab45493c516e5ae383dc5b0e760e2107f0c3af1fddd5b8b5e0";
const COLLECTION_ID = "69ca7e9bc2e9a0ad392d10ae";

async function getFields() {
    try {
        const res = await axios.get(
            `https://api.webflow.com/v2/collections/${COLLECTION_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`
                }
            }
        );

        console.log("FIELDS:\n");

        res.data.fields.forEach(field => {
            console.log("Name:", field.displayName);
            console.log("Slug:", field.slug);
            console.log("-------------------");
        });

    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

getFields();