const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

// Endpoint para crear una sesión de checkout
app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: "http://example.com/success",
            cancel_url: "http://example.com/cancel",
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
