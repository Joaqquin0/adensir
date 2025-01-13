export default function handler(req, res) {
    // Accede a la variable de entorno de la clave privada
    const keyPrivate = process.env.KEY_PRIVATE;

    // Solo permite el método GET
    if (req.method === 'GET') {
        res.status(200).json({ message: 'Clave privada obtenida correctamente', keyPrivate });
    } else {
        res.status(405).json({ message: 'Método no permitido' });
    }
}
