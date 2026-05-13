-- LitienGuard — Branding personalizable de PDFs por médico.
--
-- Los PDFs (SOAP, Odontograma, Receta, Diferencial) actualmente
-- muestran "LitienGuard" en el header. Para que el médico sienta
-- la herramienta como suya y los pacientes vean el nombre del
-- consultorio (no de la plataforma), agregamos 2 campos opcionales:
--
--   - pdf_brand_titulo: reemplaza "LitienGuard" en el header
--   - pdf_brand_subtitulo: reemplaza el subtítulo de plataforma
--
-- Si ambos son NULL, el PDF mantiene el branding de LitienGuard
-- (default seguro). El footer de cada PDF mantiene siempre la
-- referencia legal "Estructura conforme NOM-024-SSA3 · LFPDPPP"
-- por cumplimiento.

alter table public.profiles
  add column if not exists pdf_brand_titulo text;

alter table public.profiles
  add column if not exists pdf_brand_subtitulo text;

comment on column public.profiles.pdf_brand_titulo is
  'Nombre custom que aparece en el header de los PDFs en lugar de "LitienGuard". Ejemplo: "Clínica Dental Sandoval". NULL = default LitienGuard.';
comment on column public.profiles.pdf_brand_subtitulo is
  'Subtítulo custom debajo del título del header. NULL = default por tipo de PDF.';
