# Synthea fixtures — pacientes de prueba

Pacientes sintéticos en formato FHIR R4 que se usan para probar el
importer y como demo. Generados manualmente con códigos SNOMED CT
+ LOINC + RxNorm reales que LitienGuard mapea internamente.

## Cohorte incluida

| Archivo | Paciente | Dx activos | Cruce esperado |
|---|---|---|---|
| `patient-dm-ic.json` | María Hernández · F · 1965 | DM2 + HFrEF | DM+IC SGLT2 + DM+ERC ajuste (creatinina 1.6) + Cushing-screen N/A |
| `patient-evc-fa.json` | Jorge Ramírez · M · 1958 | EVC isquémico + HTA | EVC+FA anticoagulación (cuando se documente FA) + EVC+HTA control cauteloso |

## Cómo correr el importer

1. Crear un médico demo en Supabase y copiar su `auth.uid()`.
2. Ejecutar:

```
SUPABASE_MGMT_TOKEN=sbp_xxxxx \
SUPABASE_PROJECT_REF=lguhkybcrfwejaikfaze \
MEDICO_ID=<uuid-medico-demo> \
node --experimental-strip-types scripts/import-synthea.mjs \
  --input ./scripts/synthea-fixtures/ \
  --limit 100
```

3. El script reporta cuántos pacientes nuevos creó, cuántos
   encuentros/labs insertó, y qué porcentaje de Conditions se mapearon
   a DiseaseId del cerebro.

4. Loggearse como el médico demo y entrar a `/dashboard/cruces` — debes
   ver los cruces clínicos detectados automáticamente.

## Generar más pacientes con Synthea oficial

Para generar 100 o 10,000 pacientes adicionales:

```
git clone https://github.com/synthetichealth/synthea
cd synthea
./run_synthea -p 100   # 100 pacientes
```

Los archivos JSON se generan en `output/fhir/*.json`. Apuntar el
importer a ese directorio con `--input ./synthea/output/fhir/`.

Synthea está licenciado Apache 2.0 — uso comercial permitido.
