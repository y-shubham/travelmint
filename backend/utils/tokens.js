import jwt from "jsonwebtoken";

export function signScopedToken(payload, scope, expiresIn) {
  const secret =
    scope === "verify"
      ? process.env.JWT_EMAIL_SECRET
      : process.env.JWT_RESET_SECRET;
  return jwt.sign({ ...payload, scope }, secret, { expiresIn });
}

export function verifyScopedToken(token, scope) {
  const secret =
    scope === "verify"
      ? process.env.JWT_EMAIL_SECRET
      : process.env.JWT_RESET_SECRET;
  const data = jwt.verify(token, secret);
  if (data.scope !== scope) throw new Error("Invalid token scope");
  return data;
}
