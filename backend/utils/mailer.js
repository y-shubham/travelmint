import nodemailer from "nodemailer";

let _transporter = null;

function buildTransporter() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  const isGmail =
    host.toLowerCase().includes("gmail.com") ||
    user.toLowerCase().endsWith("@gmail.com");

  if (isGmail) {
    if (!user || !pass) {
      throw new Error("Missing SMTP_USER/SMTP_PASS for Gmail");
    }
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }, // Gmail App Password
    });
  }

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP env missing. Provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
    pool: true,
  });
}

function getTransporter() {
  if (!_transporter) _transporter = buildTransporter();
  return _transporter;
}

export async function sendEmail({ to, subject, html }) {
  const from = process.env.SMTP_USER; // Gmail requires the mailbox itself
  return getTransporter().sendMail({ from, to, subject, html });
}

export async function verifyMailer() {
  try {
    await getTransporter().verify();
    console.log("SMTP ready");
  } catch (e) {
    console.error("SMTP config error:", e?.message || e);
    console.error(
      "SMTP env seen by server:",
      JSON.stringify(
        {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
        },
        null,
        2
      )
    );
  }
}
