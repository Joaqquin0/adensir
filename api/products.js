const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method === "POST") {
    const { priceId } = req.body;

    if (!priceId) {
      console.error("Error: 'priceId' no se recibió.");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(400).json({ error: "El campo 'priceId' es obligatorio." });
    }

    try {
      // Obtén los detalles del precio para determinar si es recurrente o de pago único
      const price = await stripe.prices.retrieve(priceId);

      if (!price) {
        console.error(`No se encontró el precio con ID: ${priceId}`);
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(404).json({ error: "El precio especificado no existe." });
      }

      // Determina el modo según si el precio es recurrente
      const mode = price.recurring ? "subscription" : "payment";

      // Crea la sesión de checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode, // Dinámico: "payment" o "subscription"
        success_url: "https://tu-dominio.com/success",
        cancel_url: "https://tu-dominio.com/cancel",
      });

      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error("Error al crear la sesión de checkout:", error);
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
