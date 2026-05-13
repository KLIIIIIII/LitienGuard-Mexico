/**
 * Plantilla HTML para recall de paciente inactivo.
 *
 * Tono: cercano y profesional, no agresivo. Diseñado para que el
 * paciente sienta que su médico lo recuerda, no que está siendo
 * vendido. Mismo sistema visual (paleta + tipografía) que el
 * recordatorio de cita.
 */

interface RecallData {
  pacienteNombre: string;
  medicoNombre: string;
  medicoEspecialidad: string | null;
  consultorioNombre: string | null;
  consultorioTelefono: string | null;
  mesesSinConsulta: number; // calculado por la action
  mensajePersonalizado: string | null; // opcional, lo escribe el médico
  agendarUrl: string | null; // link al booking público si está activo
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

function tiempoLabel(meses: number): string {
  if (meses < 1) return "hace algunas semanas";
  if (meses === 1) return "hace un mes";
  if (meses < 12) return `hace ${meses} meses`;
  if (meses < 24) return "hace más de un año";
  return `hace ${Math.floor(meses / 12)} años`;
}

export function buildRecallHtml(data: RecallData): string {
  const tiempo = tiempoLabel(data.mesesSinConsulta);
  const telLink = data.consultorioTelefono
    ? `tel:${data.consultorioTelefono.replace(/\s+/g, "")}`
    : null;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cita de mantenimiento — ${esc(data.medicoNombre)}</title>
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
                  LitienGuard · Cita de seguimiento
                </p>
                <h1 style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color:${PALETTE.ink}; letter-spacing: -0.3px; line-height: 1.2;">
                  ${esc(data.medicoNombre)} te recuerda
                </h1>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td style="padding: 24px 32px 4px 32px;">
                <p style="margin:0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Hola ${esc(data.pacienteNombre)},
                </p>
                <p style="margin: 12px 0 0 0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Tu última visita con ${esc(data.medicoNombre)}${data.medicoEspecialidad ? `, ${esc(data.medicoEspecialidad)}` : ""}, fue <strong style="color:${PALETTE.ink};">${esc(tiempo)}</strong>. Queremos asegurarnos de que sigas bien — una consulta de mantenimiento es la forma más sencilla de detectar cambios a tiempo y mantener tu plan de tratamiento al día.
                </p>
              </td>
            </tr>

            ${
              data.mensajePersonalizado
                ? `
            <!-- Mensaje personalizado del médico -->
            <tr>
              <td style="padding: 16px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PALETTE.accentSoft}; border-radius: 8px; border-left: 3px solid ${PALETTE.validation};">
                  <tr>
                    <td style="padding: 14px 18px;">
                      <p style="margin: 0; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color:${PALETTE.validation}; font-weight: 700;">
                        Nota del médico
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 14px; color:${PALETTE.ink}; line-height: 1.55; font-style: italic;">
                        ${esc(data.mensajePersonalizado)}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }

            <!-- CTA Block -->
            <tr>
              <td style="padding: 16px 32px 8px 32px;">
                ${
                  data.agendarUrl
                    ? `
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding: 8px 0;">
                      <a href="${esc(data.agendarUrl)}" style="display: inline-block; background:${PALETTE.validation}; color:#FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-size: 14px; font-weight: 600; letter-spacing: 0.2px;">
                        Agendar cita en línea
                      </a>
                    </td>
                  </tr>
                </table>`
                    : ""
                }
                ${
                  telLink
                    ? `
                <p style="margin: ${data.agendarUrl ? "14px" : "0"} 0 0 0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6; text-align: center;">
                  ${data.agendarUrl ? "O llama directo al consultorio: " : "Llama directo al consultorio para agendar: "}<a href="${telLink}" style="color:${PALETTE.accent}; text-decoration: none; font-weight: 600;">${esc(data.consultorioTelefono)}</a>
                </p>`
                    : ""
                }
                ${
                  !data.agendarUrl && !telLink
                    ? `
                <p style="margin: 0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Para agendar, responde este correo o contacta al consultorio${data.consultorioNombre ? ` ${esc(data.consultorioNombre)}` : ""}.
                </p>`
                    : ""
                }
              </td>
            </tr>

            <!-- Sign-off -->
            <tr>
              <td style="padding: 20px 32px 24px 32px;">
                <p style="margin: 0; font-size: 14px; color:${PALETTE.inkMuted}; line-height: 1.6;">
                  Un saludo,<br />
                  <strong style="color:${PALETTE.ink};">${esc(data.medicoNombre)}</strong>${data.medicoEspecialidad ? `<br /><span style="font-size: 13px; color:${PALETTE.inkSoft};">${esc(data.medicoEspecialidad)}</span>` : ""}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 16px 32px 24px 32px; border-top: 1px solid ${PALETTE.rule}; background:${PALETTE.surfaceAlt};">
                <p style="margin: 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  Este recordatorio fue enviado por <strong style="color:${PALETTE.ink};">LitienGuard</strong>, plataforma clínica construida siguiendo los requerimientos técnicos de la NOM-024-SSA3 y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color:${PALETTE.inkSoft}; line-height: 1.6;">
                  Si ya no deseas recibir recordatorios, responde a este correo con "BAJA" y serás removido del padrón del consultorio.
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

export function buildRecallText(data: RecallData): string {
  const tiempo = tiempoLabel(data.mesesSinConsulta);
  const lines = [
    `LITIENGUARD · CITA DE SEGUIMIENTO`,
    ``,
    `Hola ${data.pacienteNombre},`,
    ``,
    `Tu última visita con ${data.medicoNombre}${data.medicoEspecialidad ? `, ${data.medicoEspecialidad}` : ""}, fue ${tiempo}. Queremos asegurarnos de que sigas bien — una consulta de mantenimiento es la forma más sencilla de detectar cambios a tiempo.`,
  ];

  if (data.mensajePersonalizado) {
    lines.push(``, `NOTA DEL MÉDICO`, data.mensajePersonalizado);
  }

  if (data.agendarUrl) {
    lines.push(``, `AGENDAR CITA EN LÍNEA`, data.agendarUrl);
  }
  if (data.consultorioTelefono) {
    lines.push(``, `TELÉFONO DEL CONSULTORIO`, data.consultorioTelefono);
  }

  lines.push(
    ``,
    `Un saludo,`,
    `${data.medicoNombre}`,
    data.medicoEspecialidad ?? "",
    ``,
    `—`,
    `LitienGuard · Estructura conforme NOM-024-SSA3 · LFPDPPP`,
    `Para darte de baja del padrón, responde con "BAJA".`,
  );

  return lines.filter(Boolean).join("\n");
}
