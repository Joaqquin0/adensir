const jwt = require("jsonwebtoken");

//const SECRET_KEY = "1f4360fd44a37e81c5c0d1700e2de1d8211efb5b0f24175bb3d5a895a50764cc0d3cf591810356e53312e2105e43fb75ac0163593d6e8957dcdf5653dca8cc79"; // Define esto en tu .env
const SECRET_KEY = process.env.JWT_SECRET_KEY; // Define esto en tu .env

const TOKEN_EXPIRATION = "5m"; // El token expira en 5 minutos

module.exports = (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

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
