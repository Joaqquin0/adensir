export default function handler(req, res) {
    const keyPrivate = process.env.KEY_PRIVATE;  // Usamos la variable de entorno para acceder a la clave
    
    // Realiza alguna operación en el backend usando la clave privada, por ejemplo, hacer una llamada a una API de Stripe
    
    if (req.method === 'GET') {
        res.status(200).json({ message: 'Operación realizada correctamente' });
    } else {
        res.status(405).json({ message: 'Método no permitido' });
    }
}
