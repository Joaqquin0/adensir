
### 5. Cambio de fotos de portada y animación (S/50) 
- Reemplazo de las tres fotos de portada que aparecen al principio de la página por nuevas imágenes proporcionadas o seleccionadas.
- Modificación o reemplazo de la animación principal según las preferencias del cliente.


## Mejoras y nuevas funcionalidades para el sistema de donaciones

### 1. Activación de PayPal en Stripe (S/250) 
- Activación y configuración de PayPal como método de pago adicional directamente en Stripe Checkout, aprovechando la disponibilidad para cuentas registradas en España.
- Pruebas para asegurar el correcto funcionamiento junto a los demás métodos de pago de Stripe.

### 2. Registro de correos y números para difusión manual (S/350) 
- Creación de un formulario en la web para que los usuarios puedan registrar su correo electrónico y/o número de WhatsApp.
- Almacenamiento seguro de estos datos en una base de datos proporcionada por Hostinger.
- (Opcional) Interfaz sencilla para que el gerente de la ONG pueda exportar o visualizar la lista de suscriptores.
- La gestión y envío de notificaciones se realizará manualmente por el gerente, agregando a los usuarios a un grupo de difusión en WhatsApp o enviando correos desde una herramienta externa.

### 3. Cambio de imagen y texto de agradecimiento (S/50)
- Reemplazo de la foto o imagen y/o texto que se muestra al usuario tras realizar una donación

### 4. Confirmación de donación por correo (S/300)
- Envío automático de un correo de confirmación al usuario tras realizar una donación.
- El correo incluirá una plantilla personalizada con el nombre del donante, monto donado, imágenes y colores de la ONG.
- Pruebas para asegurar la correcta entrega y visualización del correo.

---

### Nota secundaria

- Se revisará el flujo de pagos con Stripe para identificar y proponer una solución al problema de autenticación adicional (SCA) que afecta a tarjetas europeas. Esta revisión se considera una tarea secundaria y no está incluida como desarrollo principal en este paquete.
