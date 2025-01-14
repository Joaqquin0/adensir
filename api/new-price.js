const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).end();
      }
      
    if (req.method === "POST") {
        const { monto, tipoDonacion } = req.body;

        if (!monto || !tipoDonacion) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }

        try {
            let priceData;
            
            // Si es una donación única
            if (tipoDonacion === "unica") {
                priceData = await stripe.prices.create({
                    unit_amount: monto * 100, // Convertir a centavos
                    currency: "eur", // O la moneda que elijas
                    product_data: {
                        name: `Donación Única de $${monto}`,
                    },
                });
            }

            // Si es una suscripción
            if (tipoDonacion === "suscripcion") {
                priceData = await stripe.prices.create({
                    unit_amount: monto * 100, // Convertir a centavos
                    currency: "usd", // O la moneda que elijas
                    recurring: { interval: "month" }, // Suscripción mensual
                    product_data: {
                        name: `Suscripción mensual de $${monto}`,
                    },
                });
            }

            // Devolver el priceId generado
            res.status(200).json({ priceId: priceData.id });

        } catch (error) {
            console.error("Error al crear el precio en Stripe:", error);
            res.status(500).json({ error: "Error al crear el precio" });
        }
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
};
