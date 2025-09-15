// Email verification service using SendGrid - from javascript_sendgrid integration
import { MailService } from '@sendgrid/mail';
import { randomBytes } from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from?: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from || 'noreply@charterly.com',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function sendEmailVerification(
  email: string,
  token: string,
  firstName?: string
): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu email - Charterly</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Charterly</h1>
          <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 16px;">Fishing Charter Platform</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
            ¡Bienvenido${firstName ? ` ${firstName}` : ''}!
          </h2>
          
          <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
            Gracias por registrarte como capitán en Charterly. Para completar tu registro y acceder a tu dashboard, necesitas verificar tu dirección de email.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Verificar mi email
            </a>
          </div>
          
          <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          <p style="color: #2563eb; margin: 8px 0; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este email.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">
            © 2025 Charterly. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textVersion = `
    ¡Bienvenido${firstName ? ` ${firstName}` : ''} a Charterly!
    
    Gracias por registrarte como capitán. Para completar tu registro, verifica tu email haciendo clic en el siguiente enlace:
    
    ${verificationUrl}
    
    Este enlace expirará en 24 horas.
    
    Si no solicitaste esta verificación, puedes ignorar este email.
    
    © 2025 Charterly
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@charterly.com', // Cambiar por tu dominio verificado en SendGrid
    subject: '🎣 Verifica tu email - Charterly',
    text: textVersion,
    html: html,
  });
}

export async function sendWelcomeEmail(
  email: string,
  firstName?: string
): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';
  const dashboardUrl = `${baseUrl}/captain/dashboard`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>¡Bienvenido a Charterly!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="background-color: #2563eb; padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎣 ¡Email verificado!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">
            ¡Perfecto${firstName ? `, ${firstName}` : ''}!
          </h2>
          
          <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
            Tu email ha sido verificado exitosamente. Ahora puedes acceder a tu dashboard y comenzar el proceso de onboarding para activar tu cuenta de capitán.
          </p>
          
          <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 16px; margin: 24px 0;">
            <h3 style="color: #0369a1; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
              📋 Próximos pasos:
            </h3>
            <ul style="color: #0369a1; margin: 0; padding-left: 20px;">
              <li>Completa tu perfil de capitán</li>
              <li>Sube la documentación requerida</li>
              <li>Activa tu prueba gratuita de 1 mes</li>
              <li>¡Comienza a listar tus charters!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${dashboardUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Ir al Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">
            © 2025 Charterly. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@charterly.com',
    subject: '🎉 ¡Bienvenido a Charterly! Tu email ha sido verificado',
    html: html,
  });
}