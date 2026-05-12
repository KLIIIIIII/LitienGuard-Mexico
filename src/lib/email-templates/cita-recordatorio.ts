/**
 * Plantilla HTML para el recordatorio de cita 24h antes.
 *
 * Diseñada para máxima compatibilidad con clientes de correo (Gmail,
 * Apple Mail, Outlook, Yahoo, Thunderbird) — usa tablas y estilos inline
 * solamente. Alta jerarquía tipográfica, paleta restringida, accesible.
 */

interface RecordatorioData {
  pacienteNombre: string;
  medicoNombre: string;
  medicoEspecialidad: string | null;
  consultorioNombre: string | null;
  consultorioDireccion: string | null;
  consultorioTelefono: string | null;
  fechaLarga: string; // "viernes, 12 de mayo de 2026"
  horaCorta: string; // "14:30 hrs"
  motivo: string | null;
  cancelacionUrl: string;
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
  inkQuiet: "#B8B4A8",
  rule: "#E5E2DA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F2EB",
  canvas: "#FBF9F4",
  accent: "#274B39",
  accentSoft: "#E5EDE8",
};

export function buildRecordatorioHtml(data: RecordatorioData): string {
  const mapsUrl = data.consultorioDireccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        data.consultorioDireccion,
      )}`
    : null;

  const telLink = data.consultorioTelefono
    ? `tel:${data.consultorioTelefono.replace(/\s+/g, "")}`
    : null;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Recordatorio de cita</title>
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
                  LitienGuard · Recordatorio
                </p>
                <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color:${PALETTE.ink}; letter-spacing: -0.3px; line-height: 1.2;">
                  Tu cita es mañana
                </h1>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding: 24px 32px 4px 32px;">
                <p style="margin:0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Hola ${esc(data.pacienteNombre)},
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Te recordamos que tienes una cita programada con ${esc(data.medicoNombre)}${data.medicoEspecialidad ? `, ${esc(data.medicoEspecialidad)}` : ""}.
                </p>
              </td>
            </tr>

            <!-- Date / Time hero -->
            <tr>
              <td style="padding: 22px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PALETTE.surfaceAlt}; border-radius: 8px;">
                  <tr>
                    <td style="padding: 18px 20px;">
                      <p style="margin: 0; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color:${PALETTE.inkSoft};">
                        Cuándo
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color:${PALETTE.ink}; text-transform: capitalize; line-height: 1.3;">
                        ${esc(data.fechaLarga)}
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 15px; color:${PALETTE.accent}; font-weight: 600;">
                        ${esc(data.horaCorta)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Location -->
            ${
              data.consultorioNombre || data.consultorioDireccion
                ? `
            <tr>
              <td style="padding: 0 32px 18px 32px;">
                <p style="margin: 0 0 6px 0; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color:${PALETTE.inkSoft};">
                  Dónde
                </p>
                ${data.consultorioNombre ? `<p style="margin:0; font-size: 14px; color:${PALETTE.ink}; font-weight: 600;">${esc(data.consultorioNombre)}</p>` : ""}
                ${data.consultorioDireccion ? `<p style="margin: 4px 0 0 0; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.5;">${esc(data.consultorioDireccion)}</p>` : ""}
                ${
                  mapsUrl
                    ? `<p style="margin: 8px 0 0 0;"><a href="${mapsUrl}" style="font-size: 13px; color:${PALETTE.accent}; text-decoration: underline;">Cómo llegar</a></p>`
                    : ""
                }
              </td>
            </tr>
            `
                : ""
            }

            ${
              telLink
                ? `
            <tr>
              <td style="padding: 0 32px 18px 32px;">
                <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color:${PALETTE.inkSoft};">
                  Contacto
                </p>
                <p style="margin:0; font-size: 14px; color:${PALETTE.ink}; font-weight: 600;">
                  <a href="${telLink}" style="color:${PALETTE.ink}; text-decoration: none;">${esc(data.consultorioTelefono ?? "")}</a>
                </p>
              </td>
            </tr>
            `
                : ""
            }

            ${
              data.motivo
                ? `
            <tr>
              <td style="padding: 0 32px 18px 32px;">
                <p style="margin: 0 0 4px 0; font-size: 10px; letter-spacing: 1.4px; text-transform: uppercase; color:${PALETTE.inkSoft};">
                  Motivo de la consulta
                </p>
                <p style="margin:0; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.5;">${esc(data.motivo)}</p>
              </td>
            </tr>
            `
                : ""
            }

            <!-- Add to calendar hint -->
            <tr>
              <td style="padding: 14px 32px; background: ${PALETTE.accentSoft};">
                <p style="margin: 0; font-size: 13px; color:${PALETTE.accent}; line-height: 1.5;">
                  Adjuntamos un archivo de calendario (<strong>.ics</strong>) — al abrirlo, tu calendario te ofrecerá agregar la cita con una alarma 60 min antes.
                </p>
              </td>
            </tr>

            <!-- Cancellation -->
            <tr>
              <td style="padding: 24px 32px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  ¿Necesitas cancelar o reagendar?
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background: ${PALETTE.surface}; border: 1px solid ${PALETTE.rule}; border-radius: 6px;">
                      <a href="${data.cancelacionUrl}" style="display: inline-block; padding: 9px 18px; font-size: 13px; color:${PALETTE.ink}; text-decoration: none; font-weight: 600;">
                        Cancelar cita
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 10px 0 0 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.5;">
                  ${telLink ? "También puedes reagendar llamando al consultorio." : "También puedes responder este correo si necesitas reagendar."}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 18px 32px 26px 32px; border-top: 1px solid ${PALETTE.rule}; background:${PALETTE.surfaceAlt};">
                <p style="margin: 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  Este recordatorio fue enviado automáticamente por <strong style="color:${PALETTE.ink};">LitienGuard</strong>, plataforma clínica construida siguiendo los requerimientos técnicos de la NOM-024-SSA3 y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  En caso de emergencia médica, llama al 911. Esta plataforma no sustituye atención de urgencia.
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

export function buildRecordatorioText(data: RecordatorioData): string {
  const lines = [
    `LITIENGUARD · RECORDATORIO DE CITA`,
    ``,
    `Hola ${data.pacienteNombre},`,
    ``,
    `Te recordamos que tienes una cita mañana con ${data.medicoNombre}${data.medicoEspecialidad ? `, ${data.medicoEspecialidad}` : ""}.`,
    ``,
    `CUÁNDO`,
    `${data.fechaLarga} · ${data.horaCorta}`,
  ];

  if (data.consultorioNombre || data.consultorioDireccion) {
    lines.push(``, `DÓNDE`);
    if (data.consultorioNombre) lines.push(data.consultorioNombre);
    if (data.consultorioDireccion) lines.push(data.consultorioDireccion);
  }
  if (data.consultorioTelefono) {
    lines.push(``, `TELÉFONO`, data.consultorioTelefono);
  }
  if (data.motivo) {
    lines.push(``, `MOTIVO`, data.motivo);
  }

  lines.push(
    ``,
    `CANCELAR CITA`,
    data.cancelacionUrl,
    ``,
    `—`,
    `LitienGuard · Estructura conforme NOM-024-SSA3 · LFPDPPP`,
    `En caso de emergencia médica, llama al 911.`,
  );

  return lines.join("\n");
}
