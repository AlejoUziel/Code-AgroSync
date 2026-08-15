import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";
import { createHash } from "crypto";
import { isDatabaseConfigured, query, type ResultSetHeader } from "@/lib/db";
import { captureOperationalError, logEvent } from "@/lib/observability";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  empresaId?: string | null;
  type?: string;
};

let transporter: Transporter<SMTPPool.SentMessageInfo, SMTPPool.Options> | null = null;

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP no configurado.");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE ?? "").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS ?? 3),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

async function recordDelivery(input: SendEmailInput, state: "enviado" | "fallido", messageId?: string, errorCode?: string) {
  if (!isDatabaseConfigured) return;
  await query<ResultSetHeader>(
    `INSERT INTO email_envios (
       empresa_id, destinatario_hash, tipo, proveedor_message_id, estado, error_codigo
     ) VALUES (
       :empresaId, :recipientHash, :type, :messageId, :state, :errorCode
     )`,
    {
      empresaId: input.empresaId ?? null,
      recipientHash: createHash("sha256").update(input.to.trim().toLowerCase()).digest("hex"),
      type: input.type ?? "transactional",
      messageId: messageId ?? null,
      state,
      errorCode: errorCode ?? null,
    },
  ).catch(() => undefined);
}

export async function verifySmtpConnection() {
  const startedAt = Date.now();
  await getTransporter().verify();
  return { ok: true, latencyMs: Date.now() - startedAt };
}

export async function sendEmail(input: SendEmailInput) {
  const { to, subject, text, html } = input;
  try {
    const result = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    await recordDelivery(input, "enviado", result.messageId);
    logEvent("info", "email.sent", { type: input.type ?? "transactional", messageId: result.messageId });
    return result;
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String((error as Error & { code?: unknown }).code ?? "SMTP_ERROR") : "SMTP_ERROR";
    await recordDelivery(input, "fallido", undefined, code);
    captureOperationalError(error, "email.failed", { type: input.type ?? "transactional", code });
    throw error;
  }
}
