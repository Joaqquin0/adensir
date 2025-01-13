// server.js
const express = require("express");
const stripe = require("stripe")("sk_test_51QbEuRK9OngFy5fK5xTVUogvzh99l1bg1uAS7XGKfX2XcjwG0wOavQ1GoS1JIBr02YIB1UeNejokCy9Jd8zbMZiH00by3fyUjX");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint para obtener productos de Stripe
app.get("/api/products", async (req, res) => {
    try {
        const products = await stripe.products.list({
            expand: ["data.default_price"], // Expande los precios predeterminados
        });

        // Formatear datos para el cliente
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
    const { priceId } = req.body; // Recibe el ID del precio desde el cliente

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "payment", // Cambiar a "subscription" si es recurrente
            success_url: "http://example.com/success",
            cancel_url: "http://example.com/cancel",
        });

        res.json({ url: session.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
const PORT = 4242;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
