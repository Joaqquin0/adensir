const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET_KEY; // Define esto en tu .env
const TOKEN_EXPIRATION = "5m"; // El token expira en 5 minutos

module.exports = (req, res) => {
    if (req.method === "POST") {
        const { clientId } = req.body; // Opcional: usar un identificador para validar al cliente

        if (!clientId) {
            return res.status(400).json({ error: "clientId es obligatorio" });
        }

        // Crear un token temporal
        const token = jwt.sign({ clientId }, SECRET_KEY, { expiresIn: TOKEN_EXPIRATION });

        res.json({ token });
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
};
