/**
 * Helper para resolver el branding de los PDFs según el médico.
 *
 * Si el médico configuró pdf_brand_titulo en /dashboard/configuracion,
 * se usa ese. Si no, default a "LitienGuard". El footer SIEMPRE
 * mantiene la referencia legal independientemente del branding.
 */

export interface PdfBranding {
  /** Título grande del header. */
  titulo: string;
  /** Subtítulo opcional debajo. */
  subtitulo: string;
  /** Eyebrow superior (ej. "Documento clínico"). */
  eyebrow: string;
}

export interface ProfileBrandFields {
  pdf_brand_titulo?: string | null;
  pdf_brand_subtitulo?: string | null;
  consultorio_nombre?: string | null;
}

export function resolveBranding(
  profile: ProfileBrandFields | null | undefined,
  defaults: {
    eyebrow: string; // ej "LitienGuard · Receta médica"
    subtitulo: string; // ej "Inteligencia médica para México"
  },
): PdfBranding {
  const customTitulo = profile?.pdf_brand_titulo?.trim();
  const customSubtitulo = profile?.pdf_brand_subtitulo?.trim();

  if (customTitulo) {
    return {
      titulo: customTitulo,
      subtitulo:
        customSubtitulo ||
        profile?.consultorio_nombre?.trim() ||
        "",
      // Cuando el médico tiene branding custom, el eyebrow no menciona
      // LitienGuard — solo describe el tipo de documento.
      eyebrow: defaults.eyebrow.replace(/^LitienGuard\s*·\s*/, ""),
    };
  }

  return {
    titulo: "LitienGuard",
    subtitulo: defaults.subtitulo,
    eyebrow: defaults.eyebrow,
  };
}
