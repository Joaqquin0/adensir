const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).end();
      }
      
      if (req.method === "POST") {
        const { monto, tipoDonacion, productId } = req.body;

        // Verificar que el monto y el tipo de donación sean válidos
        if (!monto || monto <= 0 || !productId) {
            return res.status(400).json({ error: "Datos inválidos" });
        }

        try {
            // Crear un precio personalizado basado en el productId
            const price = await stripe.prices.create({
                unit_amount: monto * 100, // Stripe requiere que el monto esté en centavos
                currency: 'eur', // Cambia la moneda si es necesario
                product: productId,  // Usar el productId de la donación única
            });

            res.json({ priceId: price.id });
        } catch (error) {
            console.error("Error al crear el precio:", error);
            res.status(500).json({ error: "Error al crear el precio" });
        }
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
};