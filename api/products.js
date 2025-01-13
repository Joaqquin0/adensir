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

// Endpoint para crear una sesión de checkout
app.post("/api/create-checkout-session", async (req, res) => {
    const { priceId } = req.body;

    try {
        // Crear una sesión de checkout en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: "http://example.com/success",  // Cambia la URL de éxito según lo necesites
            cancel_url: "http://example.com/cancel",    // Cambia la URL de cancelación según lo necesites
        });

        res.json({ url: session.url }); // Retorna la URL de la sesión de checkout
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
