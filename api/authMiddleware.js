const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET_KEY; // Define esta clave en tus variables de entorno

// Middleware para autenticar el token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1]; // El token está después de "Bearer"

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }

    req.user = user; // Agrega la información del usuario al objeto de la solicitud
    next(); // Continúa con el siguiente middleware o controlador
  });
};

module.exports = authenticateToken;
