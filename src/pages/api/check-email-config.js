export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar variables de entorno
  const emailConfig = {
    EMAIL_USER: process.env.EMAIL_USER ? '✅ Configurada' : '❌ No configurada',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ Configurada' : '❌ No configurada',
    ORG_NAME: process.env.ORG_NAME ? '✅ Configurada' : '❌ No configurada',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ No configurada',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? '✅ Configurada' : '❌ No configurada'
  };

  // Verificar si las variables están completas
  const allConfigured = Object.values(emailConfig).every(status => status === '✅ Configurada');

  res.status(200).json({
    success: allConfigured,
    message: allConfigured ? 'Todas las variables están configuradas' : 'Faltan algunas variables',
    config: emailConfig,
    email_user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***@${process.env.EMAIL_USER.split('@')[1]}` : 'No configurado',
    org_name: process.env.ORG_NAME || 'No configurado'
  });
}
