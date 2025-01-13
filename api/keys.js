// /api/keys.js
export default function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite todos los orígenes
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Métodos permitidos
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Encabezados permitidos

    const { STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY } = process.env;

    // Verificar que las claves están presentes en las variables de entorno
    if (!STRIPE_PUBLIC_KEY || !STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Faltan claves de Stripe en las variables de entorno" });
    }

    // Retornar las claves públicas y secretas
    res.status(200).json({
        public: STRIPE_PUBLIC_KEY,
        secret: STRIPE_SECRET_KEY
    });
}

