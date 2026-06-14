import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`;
  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"OpenBerichtsheft" <noreply@localhost>`,
    to: email,
    subject: "E-Mail verifizieren – OpenBerichtsheft",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Willkommen, ${safeName}!</h1>
        <p style="color: #52525b; font-size: 14px; line-height: 1.6;">
          Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: #18181b; color: #ffffff; padding: 10px 24px;
                  border-radius: 8px; text-decoration: none; font-size: 14px; margin: 12px 0;">
          E-Mail bestätigen
        </a>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 16px;">
          Dieser Link ist 24 Stunden gültig. Falls Sie sich nicht registriert haben,
          können Sie diese E-Mail ignorieren.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"OpenBerichtsheft" <noreply@localhost>`,
    to: email,
    subject: "Passwort zurücksetzen – OpenBerichtsheft",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Hallo, ${safeName}!</h1>
        <p style="color: #52525b; font-size: 14px; line-height: 1.6;">
          Sie haben beantragt, Ihr Passwort zurückzusetzen. Klicken Sie auf den Link,
          um ein neues Passwort zu vergeben:
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #18181b; color: #ffffff; padding: 10px 24px;
                  border-radius: 8px; text-decoration: none; font-size: 14px; margin: 12px 0;">
          Passwort zurücksetzen
        </a>
        <p style="color: #a1a1aa; font-size: 12px; margin-top: 16px;">
          Dieser Link ist 1 Stunde gültig. Falls Sie diese Anfrage nicht gestellt haben,
          können Sie diese E-Mail ignorieren – Ihr Passwort bleibt unverändert.
        </p>
      </div>
    `,
  });
}
