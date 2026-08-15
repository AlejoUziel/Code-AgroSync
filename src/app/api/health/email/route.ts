import { accessErrorResponse, assertSameOrigin, requireOrganizationAdmin } from "@/lib/authorization";
import { isSmtpConfigured, sendEmail, verifySmtpConnection } from "@/lib/email";

export async function GET() {
  return Response.json({ configured: isSmtpConfigured() });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireOrganizationAdmin();
    const verification = await verifySmtpConnection();
    await sendEmail({
      to: session.email,
      subject: "Prueba SMTP de AgroSync",
      text: "El canal SMTP de AgroSync fue verificado correctamente.",
      html: "<p>El canal SMTP de <strong>AgroSync</strong> fue verificado correctamente.</p>",
      empresaId: session.empresaId,
      type: "smtp_test",
    });
    return Response.json({ ok: true, latencyMs: verification.latencyMs });
  } catch (error) {
    return accessErrorResponse(error, "No se pudo verificar o enviar mediante SMTP.", 500);
  }
}

