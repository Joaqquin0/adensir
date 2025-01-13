const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Middleware para añadir las cabeceras CORS a todas las respuestas
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
//
// Endpoint para obtener productos de Stripe
app.get("/api/products", async (req, res) => {
    try {
        const products = await stripe.products.list({
            expand: ["data.default_price"],
        });

        const formattedProducts = products.data.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            image: product.images[0],
            price: product.default_price.unit_amount,
            currency: product.default_price.currency,
            recurring: product.default_price.recurring || null,
        }));

        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = app;
