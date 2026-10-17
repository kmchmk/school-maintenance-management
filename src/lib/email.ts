import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { APP_NAME } from "./constants";

let transporter: Transporter | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter =
    SMTP_HOST && SMTP_USER && SMTP_PASS
      ? nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT || 465),
          secure: Number(SMTP_PORT || 465) === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        })
      : null;
  return transporter;
}

export const emailConfigured = () => getTransporter() !== null;

/** Sends an email if SMTP is configured; otherwise logs and returns. Never throws. */
export async function sendEmail(to: string[], subject: string, html: string) {
  const recipients = [...new Set(to.filter(Boolean))];
  if (recipients.length === 0) return;
  const t = getTransporter();
  if (!t) {
    console.log(`[email skipped: SMTP not configured] ${subject} -> ${recipients.join(", ")}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || `${APP_NAME} <${process.env.SMTP_USER}>`,
      to: recipients,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send email", err);
  }
}
