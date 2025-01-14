/*
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method === "GET") {
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
                default_price_id: product.default_price.id,
                recurring: product.default_price.recurring || null,
            }));

            return res.status(200).json(formattedProducts);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};
*/

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method === "GET") {
        try {
            const products = await stripe.products.list({
                expand: ["data.default_price"],  // Expande la información de los precios
            });

            // Formatear los productos solo si tienen un precio válido
            const formattedProducts = products.data
                .filter(product => product.default_price)  // Filtra solo los productos que tienen un precio
                .map(product => ({
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    image: product.images[0] || null,  // Puede no tener imagen
                    price: product.default_price ? product.default_price.unit_amount : null,
                    currency: product.default_price ? product.default_price.currency : null,
                    default_price_id: product.default_price ? product.default_price.id : null,
                    recurring: product.default_price ? product.default_price.recurring || null : null,
                }));

            return res.status(200).json(formattedProducts);
        } catch (error) {
            console.error("Error al obtener productos:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    // Responde con un error si el método HTTP no es GET
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};
