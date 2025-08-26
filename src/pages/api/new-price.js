const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Permitir solicitudes CORS
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return res.status(204).end();
    }

    // Verificar si el método es POST
    if (req.method === "POST") {
        const { monto, tipoDonacion, productId, frecuencia } = req.body;

        // Verificar que el monto y el productId sean válidos
        if (!monto || monto <= 0 || !productId) {
            return res.status(400).json({ error: "Datos inválidos" });
        }

        try {
            let price;

            // Lógica para donación única
            if (tipoDonacion === 'unica') {
                // Crear un precio personalizado basado en el productId para la donación única
                price = await stripe.prices.create({
                    unit_amount: monto * 100, // Stripe requiere que el monto esté en centavos
                    currency: 'eur', // Cambia la moneda si es necesario
                    product: productId,  // Usar el productId de la donación única
                });
            }

            // Lógica para suscripción
            else if (tipoDonacion === 'suscripcion') {
                // Verificar que la frecuencia de la suscripción esté definida
                if (!frecuencia || !['week', 'month', 'year'].includes(frecuencia)) {
                    return res.status(400).json({ error: "Frecuencia de suscripción no válida" });
                }

                let recurringInterval;
                let intervalCount = 1;

                // Establecer el intervalo de la suscripción basado en la frecuencia
                switch (frecuencia) {
                    case 'week':
                        recurringInterval = 'week';
                        break;
                    case 'month':
                        recurringInterval = 'month';
                        break;
                    case 'year':
                        recurringInterval = 'year';
                        break;
                    default:
                        return res.status(400).json({ error: "Frecuencia de suscripción no válida" });
                }

                // Crear un precio recurrente
                price = await stripe.prices.create({
                    unit_amount: monto * 100,  // Stripe requiere que el monto esté en centavos
                    currency: 'eur', // Cambia la moneda si es necesario
                    product: productId,  // Usar el productId de la suscripción
                    recurring: {
                        interval: recurringInterval,  // Establecer el intervalo
                        interval_count: intervalCount,  // Si es semanal, mensual o anual
                    },
                });
            } else {
                return res.status(400).json({ error: "Tipo de donación no válido" });
            }

            // Responder con el ID del precio creado
            res.json({ priceId: price.id });
        } catch (error) {
            console.error("Error al crear el precio:", error);
            res.status(500).json({ error: "Error al crear el precio" });
        }
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
}
