const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const authenticateToken = require("./authMiddleware");

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
    console.error("Error de autenticación:", err.message);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(401).json({ error: "Token inválido o no proporcionado." });
  }

  // Lógica del endpoint principal
  if (req.method === "POST") {
    const { priceId, customerEmail, customerName } = req.body;

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
        payment_method_types: ["card", "paypal"], // PayPal para ambos tipos inicialmente
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode,
        // URLs con parámetros para tracking
        success_url: `https://adensir.com/agradecimiento?session_id={CHECKOUT_SESSION_ID}&mode=${mode}`,
        cancel_url: `https://adensir.com/donacion?cancelled=true&mode=${mode}`,
        
        // Configuración para mejorar UX
        allow_promotion_codes: false,
        billing_address_collection: "required",
        
        // Metadata para tracking
        metadata: {
          mode: mode,
          price_id: priceId,
          created_at: new Date().toISOString(),
        },
      };

      // Configuración específica según el modo
      if (mode === "payment") {
        // Para donaciones únicas: mantener PayPal habilitado
        // sessionConfig.payment_method_types ya tiene ["card", "paypal"]
        sessionConfig.customer_creation = "if_required";
        
        // Solo metadata - sin parámetros problemáticos
        sessionConfig.payment_intent_data = {
          metadata: {
            mode: "payment",
            price_id: priceId,
            amount: price.unit_amount,
            currency: price.currency,
          },
          
          //setup_future_usage: null, // Evitar conflictos con PayPal

        };

        // Si tienes información del cliente, agrégala
        if (customerEmail) {
          sessionConfig.customer_email = customerEmail;
        }

        console.log("💳 Configurando pago único con PayPal habilitado");
        
      } else if (mode === "subscription") {
        // Para suscripciones: mantener PayPal habilitado también
        // sessionConfig.payment_method_types ya tiene ["card", "paypal"]
        sessionConfig.payment_method_types = ["card"];
        // Para suscripciones: configuración específica
        sessionConfig.subscription_data = {
          metadata: {
            mode: "subscription",
            price_id: priceId,
          },
        };

        // Si tienes información del cliente
        if (customerEmail) {
          sessionConfig.customer_email = customerEmail;
        }

        console.log("🔄 Configurando suscripción con PayPal habilitado para pruebas");
      }

      // Crear sesión de checkout en Stripe
      const session = await stripe.checkout.sessions.create(sessionConfig);

      console.log(`✅ Sesión creada - Modo: ${mode}, ID: ${session.id}`);

      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json({ 
        url: session.url,
        sessionId: session.id,
        mode: mode 
      });

    } catch (error) {
      console.error("Error al crear la sesión de checkout:", error);
      
      // Log más detallado para errores relacionados con 3D Secure
      if (error.code === 'authentication_required') {
        console.error("🔒 Error de autenticación 3D Secure:", error.message);
      }
      
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ 
        error: error.message,
        code: error.code,
        type: error.type 
      });
    }
  }

  // Manejo de métodos no permitidos
  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}