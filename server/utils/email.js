import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Create a transporter object using SMTP transport

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send email to one or multiple recipients
 * @param {string|string[]} to - One email or an array of emails
 * @param {string} subject
 * @param {string} html
 */
export async function sendMail(to, subject, html) {
  try {
    const recipients = Array.isArray(to) ? to.join(",") : to;

    const mailOptions = {
      from: `"Readly" <${process.env.MAIL_USER}>`,
      to: recipients,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Email failed:", error);
    throw new Error("Failed to send email");
  }
}
