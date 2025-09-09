import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configurar nodemailer para Hostinger
 const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true para 465, false para 587
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
<body style="max-width: 420px; margin: 0 auto; font-family: Arial, sans-serif; background: #f7f7f7; color: #222;">
  <img src="https://adensir.com/img/gracias.jpg" alt="gracias_img" style="max-width: 100%; display: block;"/>
  
  <div style="background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 24px 18px;">
    <h2 style="font-size: 20px; margin-bottom: 12px;">Hola ${customer_name},</h2>
    <p style="font-size: 15px; margin-bottom: 8px;">Gracias por tu generosa donación. Tu apoyo hace una diferencia real en nuestra misión.</p>
    <p style="font-size: 15px; margin-bottom: 8px;"><strong>Monto:</strong> $${(amount/100).toFixed(2)} ${currency.toUpperCase()}</p>
    
    <div style="background: #e9ecef; padding: 14px; border-radius: 7px; margin: 16px 0;">
      <h3 style="font-size: 15px; margin-bottom: 8px;">Detalles de tu donación:</h3>
      <p style="font-size: 15px; margin-bottom: 8px;"><strong>Tipo:</strong> ${type === 'subscription' ? 'Donación Mensual (Suscripción)' : 'Donación Única'}</p>
      <p style="font-size: 15px; margin-bottom: 8px;"><strong>ID de transacción:</strong> ${payment_id}</p>
      <p style="font-size: 15px; margin-bottom: 8px;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
  </div>
  
  <img src="https://adensir.com/img/Mesa%20de%20trabajo%201_1MEJOREMOS%20EL%20MUNDO%20A%20TRAVES%20DEL%20DEPORTE.jpg" alt="mejoremos_img" style="max-width: 100%; display: block;"/>
  <img src="https://adensir.com/img/Mesa%20de%20trabajo%201%20copia%2020MEJOREMOS%20EL%20MUNDO%20A%20TRAVES%20DEL%20DEPORTE.jpg" alt="footer_img" style="max-width: 100%; display: block;"/>
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

// FUNCIÓN MEJORADA para procesar donación única SIN customer
async function handleOneTimeDonation(paymentIntent) {
  try {
    console.log('🔍 Payment Intent recibido:', {
      id: paymentIntent.id,
      customer: paymentIntent.customer,
      receipt_email: paymentIntent.receipt_email,
      shipping: paymentIntent.shipping,
      metadata: paymentIntent.metadata
    });

    let customer_email, customer_name;

    // NUEVA ESTRATEGIA: Obtener la sesión de checkout para acceder a custom_fields
    try {
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1
      });

      if (sessions.data.length > 0) {
        const session = sessions.data[0];
        console.log('🛒 Sesión de checkout encontrada:', {
          id: session.id,
          customer_email: session.customer_email,
          customer_details: session.customer_details,
          custom_fields: session.custom_fields
        });

        // 1. Intentar con customer_details de la sesión (MÁS CONFIABLE)
        if (session.customer_details?.email) {
          customer_email = session.customer_details.email;
          customer_name = session.customer_details.name || 'Donante Anónimo';
          console.log('✅ Email obtenido de customer_details:', customer_email);
        }

        // 2. Intentar con custom_fields si los configuraste
        if (!customer_email && session.custom_fields) {
          const emailField = session.custom_fields.find(field => 
            field.key === 'donor_email' || field.type === 'text'
          );
          if (emailField && emailField.text?.value) {
            customer_email = emailField.text.value;
            customer_name = 'Donante (Custom Field)';
            console.log('✅ Email obtenido de custom_fields:', customer_email);
          }
        }
      }
    } catch (sessionError) {
      console.log('⚠️ No se pudo obtener sesión de checkout:', sessionError.message);
    }

    // 3. FALLBACK: Métodos anteriores
    if (!customer_email && paymentIntent.customer) {
      const customer = await stripe.customers.retrieve(paymentIntent.customer);
      customer_email = customer.email;
      customer_name = customer.name;
      console.log('👤 Cliente encontrado:', { email: customer_email, name: customer_name });
    }

    if (!customer_email && paymentIntent.shipping?.address?.email) {
      customer_email = paymentIntent.shipping.address.email;
      customer_name = paymentIntent.shipping?.name || 'Donante Anónimo';
      console.log('📧 Email de shipping:', customer_email);
    }

    if (!customer_email && paymentIntent.receipt_email) {
      customer_email = paymentIntent.receipt_email;
      customer_name = 'Donante (Receipt)';
      console.log('📧 Usando receipt_email:', customer_email);
    }

    if (!customer_email && paymentIntent.metadata?.donor_email) {
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
      
      // ÚLTIMO RECURSO: Email por defecto para pruebas
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

    console.log('📧 Enviando email con datos:', paymentData);
    await sendDonationEmail(paymentData);
    
  } catch (error) {
    console.error('❌ Error procesando donación única:', error);
  }
}

// Función para procesar donación por suscripción (sin cambios)
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