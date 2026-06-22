import nodemailer from "nodemailer";
import type { UserSettings } from "./types";

export function createTransporter(settings: UserSettings) {
  if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
    throw new Error("SMTP not configured. Add settings in Profile & Settings.");
  }

  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port ?? 587,
    secure: (settings.smtp_port ?? 587) === 465,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass,
    },
  });
}

export async function sendEmail(
  settings: UserSettings,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const transporter = createTransporter(settings);

  await transporter.sendMail({
    from: settings.smtp_user!,
    to,
    subject,
    text: body,
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
