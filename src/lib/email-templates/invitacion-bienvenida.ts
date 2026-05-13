/**
 * Email de bienvenida que se manda al crear una invitación.
 *
 * El link lleva a /login?email=X — ahí el médico solo tiene que
 * confirmar y pide magic link. Es la única forma de entrar al
 * sistema (no hay password).
 *
 * Tono: cercano, breve. La página de login hace el segundo paso
 * (pedir magic link). Aquí solo invitamos a dar el primer click.
 */

interface InvitacionData {
  pacienteNombre: string | null; // nombre del médico invitado (puede ser null)
  email: string;
  tierLabel: string;
  tierDescription: string;
  invitadoPorNombre: string | null;
  expiresAt: string; // ISO
  loginUrl: string; // ya incluye ?email=...
}

function esc(s: string | null | undefined): string {
  return (s ?? "").replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c] as string,
  );
}

const PALETTE = {
  ink: "#1F1E1B",
  inkMuted: "#57554F",
  inkSoft: "#8B887F",
  rule: "#E5E2DA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F2EB",
  canvas: "#FBF9F4",
  accent: "#274B39",
  accentSoft: "#E5EDE8",
  validation: "#4A6B5B",
};

function fmtExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function buildInvitacionHtml(data: InvitacionData): string {
  const greeting = data.pacienteNombre
    ? `Hola ${esc(data.pacienteNombre)},`
    : "Hola,";
  const invitador = data.invitadoPorNombre
    ? `<strong style="color:${PALETTE.ink};">${esc(data.invitadoPorNombre)}</strong> te`
    : "Te";

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tu acceso a LitienGuard</title>
  </head>
  <body style="margin:0; padding:0; background:${PALETTE.canvas}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color:${PALETTE.ink};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PALETTE.canvas}; padding: 32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background:${PALETTE.surface}; border: 1px solid ${PALETTE.rule}; border-radius: 12px; overflow: hidden;">

            <!-- Header -->
            <tr>
              <td style="padding: 28px 32px 18px 32px; border-bottom: 2px solid ${PALETTE.ink};">
                <p style="margin:0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color:${PALETTE.accent}; font-weight: 600;">
                  LitienGuard · Invitación
                </p>
                <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color:${PALETTE.ink}; letter-spacing: -0.3px; line-height: 1.2;">
                  Tu acceso a LitienGuard
                </h1>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding: 24px 32px 4px 32px;">
                <p style="margin:0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  ${greeting}
                </p>
                <p style="margin: 12px 0 0 0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  ${invitador} invitó a probar LitienGuard con el plan
                  <strong style="color:${PALETTE.ink};">${esc(data.tierLabel)}</strong>.
                  Tu acceso ya está activo.
                </p>
              </td>
            </tr>

            <!-- Plan detail -->
            <tr>
              <td style="padding: 16px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PALETTE.accentSoft}; border-radius: 8px; border-left: 3px solid ${PALETTE.validation};">
                  <tr>
                    <td style="padding: 14px 18px;">
                      <p style="margin: 0; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color:${PALETTE.validation}; font-weight: 700;">
                        Plan asignado
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; color:${PALETTE.ink}; line-height: 1.4; font-weight: 600;">
                        ${esc(data.tierLabel)}
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.5;">
                        ${esc(data.tierDescription)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding: 16px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding: 8px 0 4px 0;">
                      <a href="${esc(data.loginUrl)}" style="display: inline-block; background:${PALETTE.validation}; color:#FFFFFF; text-decoration: none; padding: 13px 30px; border-radius: 999px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px;">
                        Entrar a LitienGuard
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 14px 0 0 0; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.55; text-align: center;">
                  Te llevará al login con tu correo prellenado. Solo
                  confirmas y entras al panel.
                </p>
              </td>
            </tr>

            <!-- Help -->
            <tr>
              <td style="padding: 16px 32px 8px 32px;">
                <p style="margin: 0; font-size: 13px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  <strong style="color:${PALETTE.inkMuted};">Cómo funciona:</strong>
                  no usamos contraseñas. Cada vez que entras te
                  mandamos un link único por correo. Es más seguro y
                  no tienes que recordar nada.
                </p>
              </td>
            </tr>

            <!-- Expiry -->
            <tr>
              <td style="padding: 16px 32px 24px 32px;">
                <p style="margin: 0; font-size: 12px; color:${PALETTE.inkSoft}; line-height: 1.5;">
                  Esta invitación es para
                  <strong style="color:${PALETTE.inkMuted};">${esc(data.email)}</strong>
                  y expira el
                  <strong style="color:${PALETTE.inkMuted};">${esc(fmtExpiry(data.expiresAt))}</strong>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 16px 32px 24px 32px; border-top: 1px solid ${PALETTE.rule}; background:${PALETTE.surfaceAlt};">
                <p style="margin: 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  <strong style="color:${PALETTE.ink};">LitienGuard</strong>,
                  plataforma clínica construida siguiendo los
                  requerimientos técnicos de la NOM-024-SSA3 y la
                  LFPDPPP. Si no esperabas este correo, ignóralo —
                  nadie obtiene acceso sin clickear arriba.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildInvitacionText(data: InvitacionData): string {
  const greeting = data.pacienteNombre
    ? `Hola ${data.pacienteNombre},`
    : "Hola,";
  const invitador = data.invitadoPorNombre
    ? `${data.invitadoPorNombre} te`
    : "Te";

  return [
    `LITIENGUARD · INVITACIÓN`,
    ``,
    greeting,
    ``,
    `${invitador} invitó a probar LitienGuard con el plan ${data.tierLabel}. Tu acceso ya está activo.`,
    ``,
    `PLAN ASIGNADO`,
    `${data.tierLabel}`,
    data.tierDescription,
    ``,
    `ENTRAR A LITIENGUARD`,
    data.loginUrl,
    ``,
    `Te llevará al login con tu correo prellenado. No usamos contraseñas — cada vez que entras te mandamos un link único por correo.`,
    ``,
    `Esta invitación es para ${data.email} y expira el ${fmtExpiry(data.expiresAt)}.`,
    ``,
    `—`,
    `LitienGuard · Estructura conforme NOM-024-SSA3 · LFPDPPP`,
  ].join("\n");
}
