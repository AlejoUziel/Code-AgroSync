const developmentSecret = "agrosync-development-only-session-secret-2026";

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);

  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode(developmentSecret);
  }

  throw new Error("SESSION_SECRET debe estar configurada con al menos 32 caracteres.");
}
