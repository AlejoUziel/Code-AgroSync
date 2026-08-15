import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";
import * as OTPAuth from "otpauth";
import { getSessionSecret } from "@/lib/session-secret";

const issuer = "AgroSync";
const period = 30;

function encryptionKey() {
  const configured = process.env.MFA_ENCRYPTION_KEY?.trim();
  const material = configured && configured.length >= 32
    ? Buffer.from(configured, "utf8")
    : Buffer.from(getSessionSecret());
  return createHash("sha256").update(material).digest();
}

export function encryptMfaSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptMfaSecret(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) throw new Error("Secreto MFA cifrado invalido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createMfaEnrollment(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period,
    secret,
  });
  return { secret: secret.base32, uri: totp.toString() };
}

export function validateTotp(secretValue: string, token: string) {
  if (!/^\d{6}$/.test(token)) return null;
  const totp = new OTPAuth.TOTP({
    issuer,
    label: "AgroSync",
    algorithm: "SHA1",
    digits: 6,
    period,
    secret: OTPAuth.Secret.fromBase32(secretValue),
  });
  const delta = totp.validate({ token, window: 1 });
  if (delta === null) return null;
  return totp.counter() + delta;
}

export function createRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const value = randomBytes(8).toString("hex").toUpperCase();
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}`;
  });
}

export function hashRecoveryCode(userId: string, code: string) {
  return createHash("sha256")
    .update(`${userId}:${code.replace(/[^A-Fa-f0-9]/g, "").toUpperCase()}`)
    .digest("hex");
}

export function consumeRecoveryCode(userId: string, code: string, storedHashes: string[]) {
  const candidate = Buffer.from(hashRecoveryCode(userId, code), "hex");
  const index = storedHashes.findIndex((stored) => {
    const expected = Buffer.from(stored, "hex");
    return expected.length === candidate.length && timingSafeEqual(expected, candidate);
  });
  if (index < 0) return null;
  return storedHashes.filter((_, storedIndex) => storedIndex !== index);
}

