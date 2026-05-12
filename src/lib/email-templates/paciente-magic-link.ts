/**
 * Email del magic link para acceso del paciente a su expediente.
 *
 * Tono: claro, respetuoso, sin jerga clínica. Mismo lenguaje visual que
 * el recordatorio de cita: paleta restringida, tipografía system, tablas
 * para máxima compatibilidad con clientes de correo.
 */

interface MagicLinkData {
  accessUrl: string;
  expiraEnHoras: number;
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
};

export function buildPacienteMagicLinkHtml(data: MagicLinkData): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acceso a tu expediente</title>
  </head>
  <body style="margin:0; padding:0; background:${PALETTE.canvas}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color:${PALETTE.ink};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PALETTE.canvas}; padding: 32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background:${PALETTE.surface}; border: 1px solid ${PALETTE.rule}; border-radius: 12px; overflow: hidden;">

            <tr>
              <td style="padding: 28px 32px 18px 32px; border-bottom: 2px solid ${PALETTE.ink};">
                <p style="margin:0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color:${PALETTE.accent}; font-weight: 600;">
                  LitienGuard · Portal del paciente
                </p>
                <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color:${PALETTE.ink}; letter-spacing: -0.3px; line-height: 1.2;">
                  Accede a tu expediente
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 32px 4px 32px;">
                <p style="margin:0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Solicitaste acceso a tu información clínica registrada en LitienGuard. Da clic en el siguiente botón para ver tu expediente:
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                  <tr>
                    <td style="background:${PALETTE.accent}; border-radius: 8px;">
                      <a href="${esc(data.accessUrl)}" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color:${PALETTE.surface}; text-decoration: none; letter-spacing: 0.2px;">
                        Ver mi expediente
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 32px 22px 32px;">
                <p style="margin: 0; font-size: 12px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  Si el botón no funciona, copia y pega esta dirección en tu navegador:
                </p>
                <p style="margin: 6px 0 0 0; font-size: 12px; color:${PALETTE.accent}; word-break: break-all; line-height: 1.5;">
                  ${esc(data.accessUrl)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 14px 32px; background: ${PALETTE.accentSoft};">
                <p style="margin: 0; font-size: 12px; color:${PALETTE.accent}; line-height: 1.6;">
                  Este enlace es único, de un solo uso, y expira en <strong>${data.expiraEnHoras} horas</strong>. Si no fuiste tú quien lo solicitó, puedes ignorar este correo — nadie más tiene acceso.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 22px 32px;">
                <p style="margin: 0; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Desde tu expediente puedes:
                </p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.7;">
                  <li>Ver tus citas próximas y pasadas</li>
                  <li>Cancelar citas que aún no han ocurrido</li>
                  <li>Consultar tus recetas firmadas</li>
                  <li>Ejercer tus derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)</li>
                </ul>
              </td>
            </tr>

            <tr>
              <td style="padding: 18px 32px 26px 32px; border-top: 1px solid ${PALETTE.rule}; background:${PALETTE.surfaceAlt};">
                <p style="margin: 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  Acceso conforme al artículo 22 de la <strong style="color:${PALETTE.ink};">Ley Federal de Protección de Datos Personales en Posesión de los Particulares</strong>. Esta visita queda registrada en el sistema con fecha, hora y dispositivo.
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

export function buildPacienteMagicLinkText(data: MagicLinkData): string {
  return `LITIENGUARD · PORTAL DEL PACIENTE

Accede a tu expediente

Solicitaste acceso a tu información clínica registrada en LitienGuard.
Visita el siguiente enlace para ver tu expediente:

${data.accessUrl}

Este enlace es único, de un solo uso, y expira en ${data.expiraEnHoras} horas.

Si no fuiste tú quien lo solicitó, puedes ignorar este correo.

Desde tu expediente puedes:
  - Ver tus citas próximas y pasadas
  - Cancelar citas que aún no han ocurrido
  - Consultar tus recetas firmadas
  - Ejercer tus derechos ARCO

—
LitienGuard · LFPDPPP art. 22
Esta visita queda registrada en el sistema.`;
}
