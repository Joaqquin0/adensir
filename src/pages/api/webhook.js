import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configurar nodemailer para producción
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Función para enviar email de confirmación
async function sendDonationEmail(paymentData) {
  const { customer_email, customer_name, amount, currency, type, payment_id } = paymentData;
  
  // Validar que tenemos todos los datos necesarios
  if (!customer_email) {
    console.error('❌ Error: customer_email está vacío');
    return { success: false, error: 'customer_email está vacío' };
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Error: Variables de entorno de email no configuradas');
    return { success: false, error: 'Variables de entorno de email no configuradas' };
  }

  console.log('📧 Preparando email para:', customer_email);
  
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Confirmación de Donación - ${process.env.ORG_NAME}</title>
    </head>
    <body style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <img src="https://adensir.com/img/gracias.jpg" alt="gracias_img" style="max-width:100%;height:auto;"/>
      </div>
      <div style="padding: 30px;">
        <h2 style="font-size: 24px; margin-bottom: 16px;">Hola ${customer_name},</h2>
        <p style="font-size: 16px;">Gracias por tu generosa donación. Tu apoyo hace una diferencia real en nuestra misión.</p>
        <p style="font-size: 16px;"><strong>Monto:</strong> $${(amount/100).toFixed(2)} ${currency.toUpperCase()}</p>
        <div style="background-color: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="font-size: 20px; margin-bottom: 10px;">Detalles de tu donación:</h3>
          <p style="font-size: 16px;"><strong>Tipo:</strong> ${type === 'subscription' ? 'Donación Mensual (Suscripción)' : 'Donación Única'}</p>
          <p style="font-size: 16px;"><strong>ID de transacción:</strong> ${payment_id}</p>
          <p style="font-size: 16px;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
      </div>
      <div style="text-align: center;">
        <img src="https://adensir.com/img/Mesa%20de%20trabajo%201_1MEJOREMOS%20EL%20MUNDO%20A%20TRAVES%20DEL%20DEPORTE.jpg" alt="mejoremos_img" style="max-width:100%;height:auto;display:block;margin-bottom:-10px;"/>
        <img src="https://adensir.com/img/Mesa%20de%20trabajo%201%20copia%2020MEJOREMOS%20EL%20MUNDO%20A%20TRAVES%20DEL%20DEPORTE.jpg" alt="footer_img" style="max-width:100%;height:auto;display:block;margin-top:-10px;"/>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.ORG_NAME}" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: `Confirmación de donación - ${process.env.ORG_NAME}`,
    html: emailTemplate
  };

  console.log('📧 Configuración de email:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject
  });

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación enviado exitosamente a:', customer_email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

// Función para procesar donación única
async function handleOneTimeDonation(paymentIntent) {
  try {
    console.log('🔍 Payment Intent recibido:', {
      id: paymentIntent.id,
      customer: paymentIntent.customer,
      receipt_email: paymentIntent.receipt_email,
      shipping: paymentIntent.shipping
    });

    let customer_email, customer_name;

    // 1. Intentar obtener email del customer (si existe)
    if (paymentIntent.customer) {
      const customer = await stripe.customers.retrieve(paymentIntent.customer);
      customer_email = customer.email;
      customer_name = customer.name;
      console.log('👤 Cliente encontrado:', { email: customer_email, name: customer_name });
    }

    // 2. Si no hay customer, intentar con shipping address
    if (!customer_email && paymentIntent.shipping?.address?.email) {
      customer_email = paymentIntent.shipping.address.email;
      customer_name = paymentIntent.shipping?.name || 'Donante Anónimo';
      console.log('📧 Email de shipping:', customer_email);
    }


    // 3. Si no hay email aún, usar receipt_email
    if (!customer_email && paymentIntent.receipt_email) {
      customer_email = paymentIntent.receipt_email;
      customer_name = 'Donante (Checkout)';
      console.log('📧 Usando receipt_email:', customer_email);
    }

    // 4. Si no hay email aún, usar metadata.donor_email
    if (!customer_email && paymentIntent.metadata && paymentIntent.metadata.donor_email) {
      customer_email = paymentIntent.metadata.donor_email;
      customer_name = 'Donante (Metadata)';
      console.log('📧 Usando metadata.donor_email:', customer_email);
    }

    // Verificar que tenemos un email válido
    if (!customer_email) {
      console.error('❌ No se encontró email del cliente');
      console.log('📋 Datos disponibles:', {
        customer: paymentIntent.customer,
        receipt_email: paymentIntent.receipt_email,
        shipping: paymentIntent.shipping,
        metadata: paymentIntent.metadata
      });
      // Para pruebas, usar email por defecto
      customer_email = process.env.EMAIL_USER;
      customer_name = 'Donante (Email no proporcionado)';
      console.log('⚠️ Usando email por defecto para pruebas:', customer_email);
    }

    const paymentData = {
      customer_email,
      customer_name: customer_name || 'Donante Anónimo',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      type: 'one-time',
      payment_id: paymentIntent.id
    };

    console.log('📧 Enviando email a:', customer_email);
    await sendDonationEmail(paymentData);
    
  } catch (error) {
    console.error('❌ Error procesando donación única:', error);
  }
}

// Función para procesar donación por suscripción
async function handleSubscriptionDonation(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    
    const paymentData = {
      customer_email: customer.email,
      customer_name: customer.name || 'Donante Anónimo',
      amount: invoice.amount_paid,
      currency: invoice.currency,
      type: 'subscription',
      payment_id: invoice.payment_intent
    };

    await sendDonationEmail(paymentData);
    
  } catch (error) {
    console.error('❌ Error procesando donación por suscripción:', error);
  }
}

// Middleware para manejar el body raw
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Obtener el body raw
  const rawBody = await getRawBody(req);
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verificar la firma del webhook
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook verificado correctamente');
  } catch (err) {
    console.error('❌ Error verificando webhook:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('📨 Evento recibido:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Solo procesar si NO es parte de una suscripción
        if (!event.data.object.invoice) {
          console.log('💰 Procesando donación única...');
          await handleOneTimeDonation(event.data.object);
        } else {
          console.log('💰 Payment Intent de suscripción - ignorando (se procesará en invoice.payment_succeeded)');
        }
        break;
      
      case 'invoice.payment_succeeded':
        console.log('🔄 Procesando donación por suscripción...');
        await handleSubscriptionDonation(event.data.object);
        break;
      
      case 'customer.subscription.created':
        console.log('🆕 Nueva suscripción creada:', event.data.object.id);
        // No enviar email aquí, se enviará en invoice.payment_succeeded
        break;
      
      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
    console.log('✅ Webhook procesado exitosamente');
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función para obtener el body raw
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data, 'utf8'));
    });
    req.on('error', reject);
  });
}

// Configuración para Next.js API routes
export const config = {
  api: {
    bodyParser: false, // Necesario para webhooks de Stripe
  },
};
