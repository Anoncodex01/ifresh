// Server-side only - nodemailer requires Node.js
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST as string;
const port = Number(process.env.SMTP_PORT || 465);
const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false';
const user = process.env.SMTP_USER as string;
const pass = process.env.SMTP_PASS as string;

const fromEmail = (process.env.FROM_EMAIL || user) as string;
const fromName = (process.env.FROM_NAME || 'iFRESH') as string;

export function getTransporter() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure, // true for 465, false for other ports
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(opts: { to: string | string[]; subject: string; html: string; }) {
  const transporter = getTransporter();
  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];
  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: toList.join(', '),
    subject: opts.subject,
    html: opts.html,
  });
  return info;
}

export function renderIfreshMonthlyTemplate(vars: { customerName: string; shopUrl: string }) {
  const { customerName, shopUrl } = vars;
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111;">
    <h2>Monthly Reminder – It’s iFresh Day!</h2>
    <p>Hi ${customerName},</p>
    <p>It’s the 25th - your perfect day to refresh your beard care routine with iFresh!</p>
    <p>Place your order today and enjoy:</p>
    <ul>
      <li>Fresh stock of your favorite products</li>
      <li>Loyalty points on every purchase</li>
      <li>Fast delivery, wherever you are</li>
    </ul>
    <p>
      <a href="${shopUrl}" style="display:inline-block;background:#b47435;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Shop Now</a>
    </p>
    <p>Thank you for being part of the iFresh family!</p>
  </div>`;
}
