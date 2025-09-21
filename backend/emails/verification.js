export default (name, link) => `
  <div style="font-family:sans-serif">
    <h2>Verify your email</h2>
    <p>Hi ${name || "there"}, confirm your email to activate your account.</p>
    <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Verify Email</a></p>
    <p>If the button doesn’t work, copy & paste this link:<br>${link}</p>
  </div>`;
