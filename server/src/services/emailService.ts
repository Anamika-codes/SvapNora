import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";
import { logger } from "../logger";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (env.EMAIL_PROVIDER !== "smtp") return null;
  if (transporter) return transporter;
  if (!env.SMTP_HOST) {
    logger.warn("EMAIL_PROVIDER=smtp but SMTP_HOST is not configured; email disabled.");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export function isEmailConfigured(): boolean {
  return env.EMAIL_PROVIDER === "smtp" && Boolean(env.SMTP_HOST) && Boolean(env.CONTACT_TO_EMAIL);
}

export interface ContactEmail {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

/**
 * Send a contact-form notification. Returns true when delivered, false when
 * email is not configured or delivery fails (the submission is always stored).
 */
export async function sendContactNotification(payload: ContactEmail): Promise<boolean> {
  const tx = getTransporter();
  if (!tx || !env.CONTACT_TO_EMAIL) return false;

  try {
    await tx.sendMail({
      from: env.EMAIL_FROM,
      to: env.CONTACT_TO_EMAIL,
      replyTo: payload.email,
      subject: `[SvapNora Contact] ${payload.subject}`,
      text: [
        `New contact submission`,
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Category: ${payload.category}`,
        "",
        payload.message,
      ].join("\n"),
    });
    return true;
  } catch (err) {
    logger.error({ err }, "failed to send contact notification email");
    return false;
  }
}
