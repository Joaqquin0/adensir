# Variables de Entorno Requeridas

## Para Desarrollo Local (.env.local)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_publica_aqui

# JWT Configuration
JWT_SECRET_KEY=tu_clave_secreta_jwt_aqui

# Email Configuration
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_de_aplicacion_gmail
ORG_NAME=ADENSIR

# Webhook Secret (para desarrollo local con Stripe CLI)
STRIPE_WEBHOOK_SECRET_LOCAL=whsec_webhook_secret_del_stripe_cli
```

## Para Producción (Vercel)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_tu_clave_secreta_produccion
STRIPE_PUBLISHABLE_KEY=pk_live_tu_clave_publica_produccion

# JWT Configuration
JWT_SECRET_KEY=tu_clave_secreta_jwt_produccion

# Email Configuration
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_de_aplicacion_gmail
ORG_NAME=ADENSIR

# Webhook Secret (para producción)
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret_de_produccion
```

## Pasos para Configurar Webhooks

### 1. Desarrollo Local
1. Instalar Stripe CLI: https://stripe.com/docs/stripe-cli
2. Ejecutar: `stripe listen --forward-to localhost:3000/api/webhook`
3. Copiar el webhook secret que te dé
4. Agregarlo a `.env.local` como `STRIPE_WEBHOOK_SECRET_LOCAL`

### 2. Producción
1. Ir a [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Crear nuevo webhook endpoint: `https://tu-dominio.vercel.app/api/webhook`
3. Seleccionar eventos:
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
   - `customer.subscription.created`
4. Copiar el webhook secret
5. Agregarlo a Vercel como `STRIPE_WEBHOOK_SECRET`

## Notas Importantes
- **Nunca** subas las claves secretas a Git
- Usa claves de **test** para desarrollo
- Usa claves de **live** para producción
- El webhook secret es diferente para desarrollo y producción
