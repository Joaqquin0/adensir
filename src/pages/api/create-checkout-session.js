const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const authenticateToken = require("./authMiddleware"); // Importa el middleware

export default async function handler(req, res) {
  // Manejo de preflight (CORS) para solicitudes de navegadores
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  // Verifica el token antes de procesar la solicitud
  try {
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  } catch (err) {
    // Si el token no es válido, el middleware devuelve un error
    console.error("Error de autenticación:", err.message);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(401).json({ error: "Token inválido o no proporcionado." });
  }

  // Lógica del endpoint principal
  if (req.method === "POST") {
    const { priceId } = req.body;

    if (!priceId) {
      console.error("Error: 'priceId' no se recibió.");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(400).json({ error: "El campo 'priceId' es obligatorio." });
    }

    try {
      // Recuperar información del precio desde Stripe
      const price = await stripe.prices.retrieve(priceId);

      if (!price) {
        console.error(`No se encontró el precio con ID: ${priceId}`);
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(404).json({ error: "El precio especificado no existe." });
      }

      // Determinar el modo: 'payment' o 'subscription'
      const mode = price.recurring ? "subscription" : "payment";

      // Configuración base para la sesión de checkout
      const sessionConfig = {
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        success_url: "https://adensir.com/agradecimiento",
        cancel_url: "https://adensir.com/donacion",
      };

      // Para donaciones únicas, crear customer para capturar email
      if (mode === "payment") {
        sessionConfig.customer_creation = "always";
      }
      // Para suscripciones no agregamos customer_creation ya que Stripe maneja automáticamente

      // Crear sesión de checkout en Stripe
      const session = await stripe.checkout.sessions.create(sessionConfig);

      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error("Error al crear la sesión de checkout:", error);
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ error: error.message });
    }
  }

  // Manejo de métodos no permitidos
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
