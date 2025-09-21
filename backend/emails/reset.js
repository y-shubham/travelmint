export default (name, link) => `
  <div style="font-family:sans-serif">
    <h2>Reset your password</h2>
    <p>Hi ${name || "there"}, click below to set a new password.</p>
    <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Reset Password</a></p>
    <p>This link expires soon. If you didn’t request it, ignore this email.</p>
    <p>${link}</p>
  </div>`;
