import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso de privacidad de LitienGuard conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
};

export default function AvisoPrivacidadPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Aviso de privacidad."
        description="Última actualización: mayo 2026. Cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento."
        variant="alt"
      />

      <article className="lg-shell max-w-3xl py-12">
        <LegalSection number="01" title="Identificación del responsable">
          <p>
            <strong>LitienGuard</strong> (en adelante, &quot;el
            Responsable&quot;), con domicilio en la Ciudad de México, México, es
            responsable del tratamiento de sus datos personales conforme a la
            LFPDPPP y su Reglamento.
          </p>
          <p>
            Para cualquier asunto relacionado con datos personales, puede
            contactarnos en:{" "}
            <a
              href="mailto:privacidad@litienguard.mx"
              className="text-accent underline"
            >
              privacidad@litienguard.mx
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection number="02" title="Datos personales que recabamos">
          <p>Recabamos las siguientes categorías de datos personales:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Datos de identificación: nombre, correo electrónico.</li>
            <li>
              Datos de contacto: tipo de usuario (médico, paciente, hospital).
            </li>
            <li>Mensaje libre proporcionado en formularios de contacto.</li>
            <li>
              Datos técnicos derivados del uso del sitio: dirección IP, user
              agent, identificadores de campaña (UTM).
            </li>
          </ul>
          <p>
            <strong>
              No recabamos datos personales sensibles ni datos de salud
            </strong>{" "}
            a través de este sitio público.
          </p>
        </LegalSection>

        <LegalSection number="03" title="Finalidades del tratamiento">
          <p>
            <strong>Finalidades primarias</strong> (sin las cuales no podemos
            atender su solicitud):
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Atender solicitudes de información y acceso al programa piloto.
            </li>
            <li>Establecer comunicación de seguimiento sobre su solicitud.</li>
            <li>Cumplir con obligaciones legales aplicables al Responsable.</li>
          </ul>
          <p>
            <strong>Finalidades secundarias</strong> (puede oponerse en
            cualquier momento):
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Análisis interno del interés en el producto.</li>
            <li>
              Envío de actualizaciones sobre el desarrollo de LitienGuard.
            </li>
          </ul>
        </LegalSection>

        <LegalSection number="04" title="Transferencias de datos">
          <p>
            Sus datos podrán ser transmitidos a los siguientes terceros con la
            única finalidad de operar este sitio:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Vercel Inc. (hosting del sitio web).</li>
            <li>Supabase Inc. (base de datos y almacenamiento).</li>
            <li>Resend (envío de correo transaccional).</li>
          </ul>
          <p>
            Estos proveedores tratan sus datos exclusivamente bajo nuestras
            instrucciones y conforme a sus respectivas políticas de seguridad y
            privacidad.{" "}
            <span className="text-ink-soft">
              [verificar con abogado: incluir cláusula de transferencia
              internacional conforme art. 36 LFPDPPP]
            </span>
          </p>
        </LegalSection>

        <LegalSection number="05" title="Derechos ARCO">
          <p>
            Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse
            (Derechos ARCO) al tratamiento de sus datos personales, así como a
            limitar su uso o divulgación, revocar el consentimiento otorgado y
            ejercer su derecho de portabilidad.
          </p>
          <p>
            Para ejercer cualquiera de estos derechos, envíe una solicitud por
            escrito al correo{" "}
            <a
              href="mailto:privacidad@litienguard.mx"
              className="text-accent underline"
            >
              privacidad@litienguard.mx
            </a>{" "}
            indicando: (i) su nombre, (ii) documentos que acrediten su
            identidad, (iii) descripción clara del derecho que desea ejercer y
            de los datos involucrados, y (iv) cualquier otro elemento que
            facilite su localización.
          </p>
          <p>
            Le responderemos en un plazo no mayor a{" "}
            <strong>20 días hábiles</strong> conforme al artículo 32 de la
            LFPDPPP.
          </p>
        </LegalSection>

        <LegalSection
          number="06"
          title="Mecanismos para limitar uso o divulgación"
        >
          <p>
            Puede solicitar en cualquier momento la inclusión en nuestra lista
            interna de exclusión enviando un correo a la dirección señalada en
            la sección 01 con el asunto &quot;LIMITACIÓN DE USO&quot;.
          </p>
        </LegalSection>

        <LegalSection number="07" title="Cambios al aviso de privacidad">
          <p>
            Cualquier modificación al presente Aviso será notificada en este
            mismo sitio con al menos 15 días naturales de anticipación a su
            entrada en vigor.
          </p>
        </LegalSection>

        <LegalSection number="08" title="Autoridad competente">
          <p>
            Si considera que su derecho a la protección de datos personales ha
            sido vulnerado, puede acudir al Instituto Nacional de Transparencia,
            Acceso a la Información y Protección de Datos Personales (INAI):{" "}
            <a
              href="https://home.inai.org.mx"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline"
            >
              home.inai.org.mx
            </a>
            .
          </p>
        </LegalSection>

        <p className="mt-12 text-caption text-ink-soft">
          [verificar con abogado] Este aviso es una plantilla estructural
          conforme a la LFPDPPP. Antes de su uso público debe ser revisado por
          un abogado especialista en protección de datos.
        </p>
      </article>
    </>
  );
}
