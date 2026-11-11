import { ENTITY } from "../site.mjs";

export default {
  lang: "es",
  title: "Términos y condiciones de LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "Esta es una traducción. La versión en alemán es vinculante.",
  sections: [
    {
      id: "anbieter",
      h: "1. Proveedor y ámbito de aplicación",
      html: `<p>El proveedor de LiczMat Pro es <b>${ENTITY.name}</b>, ${ENTITY.address}, teléfono: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, correo electrónico: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, NIF/IVA: ${ENTITY.taxId}.</p><p>Los presentes Términos y condiciones se aplican a la suscripción de pago <b>LiczMat Pro</b>, ofrecida en liczmat.com para la aplicación web en <a href="/app/">liczmat.com/app/</a>. Las calculadoras gratuitas en liczmat.com, la aplicación para Android y la cuenta gratuita de LiczMat se proporcionan de forma gratuita y no forman parte del contrato de pago.</p><p>Se entiende por consumidor, en el sentido del artículo 13 del Código Civil alemán (BGB), toda persona física que celebre un negocio jurídico con fines que no puedan atribuirse predominantemente ni a su actividad comercial ni a su actividad profesional independiente. Se entiende por empresario, en el sentido del artículo 14 del BGB, toda persona física o jurídica o sociedad con capacidad jurídica que, al celebrar el contrato, actúe en el ejercicio de su actividad comercial o profesional independiente.</p><p>No se aplican las condiciones generales propias del cliente.</p>`
    },
    {
      id: "leistung",
      h: "2. Prestación de servicios",
      html: `<p>LiczMat Pro pone a su disposición en el navegador las funciones Pro tal como se describen en la <a href="/es/liczmat-pro/">página de LiczMat Pro</a> en el momento de realizar el pedido. Estas incluyen, en particular, la gestión de clientes, presupuestos en formato PDF y con enlace para compartir, planificación de plazos, precios y costes en proyectos, así como el almacenamiento de los datos de la empresa. LiczMat almacena en su cuenta los datos introducidos por usted.</p><p>Los cálculos y los presupuestos elaborados a partir de ellos son herramientas de ayuda. Le corresponde a usted verificar cantidades, precios, resultados y la idoneidad para el fin previsto antes de comprar material o presentar una oferta.</p><p>No se garantiza una disponibilidad ininterrumpida. Pueden producirse tareas de mantenimiento, anomalías técnicas e interrupciones. Procuramos limitar las restricciones al mínimo posible.</p>`
    },
    {
      id: "test",
      h: "3. Período de prueba gratuito",
      html: `<p>Las cuentas nuevas reciben LiczMat Pro <b>gratis durante 14 días</b>. Para ello no se requieren datos de pago. El período de prueba finaliza automáticamente y no se convierte en una suscripción de pago. Tras su finalización, la cuenta vuelve al plan gratuito.</p>`
    },
    {
      id: "vertrag",
      h: "4. Celebración del contrato",
      html: `<p>La presentación de LiczMat Pro en el sitio web no constituye una oferta vinculante para la celebración de un contrato.</p><p>Para realizar el pedido, inicia sesión en <a href="/app/">liczmat.com/app/</a>, selecciona la suscripción mensual o anual y hace clic en el botón de compra. Se le redirige a la página de pago de Stripe. Allí introduce su dirección de correo electrónico y sus datos de pago. Antes del clic definitivo puede revisar y corregir todos los datos introducidos. El contrato se celebra cuando hace clic en el botón de confirmación de la suscripción de pago.</p><p>El proveedor de servicios de pago es Stripe Payments Europe, Limited (Irlanda). Stripe confirma la celebración del contrato por correo electrónico.</p><p>El contrato puede formalizarse en cualquiera de los 13 idiomas ofrecidos en el sitio web. La versión en alemán es vinculante. No conservamos el texto del contrato de forma separada. Los presentes Términos y condiciones están siempre disponibles en esta dirección y pueden guardarse o imprimirse. Los recibos y facturas están disponibles en el portal de clientes de Stripe.</p>`
    },
    {
      id: "preise",
      h: "5. Precios y pago",
      html: `<p>Se aplican los precios indicados en la <a href="/es/liczmat-pro/">página de LiczMat Pro</a> y en la pantalla de pago en el momento del pedido. Se trata de precios finales. No existen costes adicionales. La facturación se efectúa en la moneda mostrada en la pantalla de pago.</p><p>El precio se factura por adelantado para el período correspondiente, un mes o un año, y se cobra automáticamente al comienzo de cada período mediante el método de pago seleccionado. Se encuentran disponibles los métodos de pago ofrecidos en la pantalla de pago.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Duración y cancelación",
      html: `<h3>6.1. Suscripción mensual</h3><p>La suscripción mensual tiene una duración de un mes. Se renueva sucesivamente por un mes más si no se cancela. Puede cancelarla en cualquier momento con efecto al término del mes contractual en curso.</p><h3>6.2. Suscripción anual</h3><p>La duración inicial es de un año. Puede cancelar la suscripción en cualquier momento con efecto al término de ese año. Si no se cancela, continuará por tiempo indefinido tras el primer año y podrá cancelarse en cualquier momento con un plazo de preaviso de un mes. La facturación continuará realizándose por adelantado anualmente. Le reembolsaremos de forma prorrateada cualquier importe ya abonado correspondiente al período posterior a la finalización del contrato.</p><h3>6.3. Vías de cancelación</h3><p>Puede cancelar la suscripción en el portal de clientes a través de la sección <b>Cuenta</b> en <a href="/app/">liczmat.com/app/</a>, mediante el botón <a href="/es/cancelar-contrato/">«Cancelar contratos aquí»</a>, por correo electrónico a <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> o mediante carta dirigida a ${ENTITY.name}, ${ENTITY.address}. El derecho a rescindir el contrato por causa justificada permanece inalterado.</p><h3>6.4. Consecuencias de la finalización del contrato</h3><p>Una vez finalizado el contrato, la cuenta vuelve al plan gratuito. Sus datos permanecen almacenados en la cuenta. Las funciones Pro dejan de estar disponibles hasta que se vuelva a solicitar LiczMat Pro. Encontrará información sobre la eliminación de la cuenta en la <a href="/es/politica-de-privacidad/">Política de privacidad</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Información sobre el ejercicio del derecho de desistimiento",
      html: `<p>El siguiente derecho legal de desistimiento es aplicable únicamente a los consumidores.</p><h3>Derecho de desistimiento</h3><p>Tiene usted derecho a desistir del presente contrato en un plazo de 14 días sin necesidad de justificación.</p><p>El plazo de desistimiento expirará a los 14 días del día de la celebración del contrato.</p><p>Para ejercer el derecho de desistimiento, deberá usted notificarnos a <b>${ENTITY.name}</b>, ${ENTITY.address}, teléfono: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, correo electrónico: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, su decisión de desistir del presente contrato a través de una declaración inequívoca, por ejemplo, una carta enviada por correo postal o por correo electrónico.</p><p>Podrá utilizar el modelo de formulario de desistimiento que figura a continuación o la función de desistimiento en la página <a href="/es/desistimiento/">«Desistir del contrato aquí»</a>, aunque su uso no es obligatorio. Si recurre a esta opción en línea, le transmitiremos sin demora indebida en un soporte duradero, por ejemplo por correo electrónico, el acuse de recibo de dicho desistimiento con indicación de su contenido, así como la fecha y la hora de su recepción.</p><p>Para cumplir el plazo de desistimiento, basta con que la comunicación relativa al ejercicio por su parte de este derecho sea enviada antes de que venza el plazo correspondiente.</p><h3>Consecuencias del desistimiento</h3><p>En caso de desistimiento por su parte, le devolveremos todos los pagos recibidos de usted, sin ninguna demora indebida y, en todo caso, a más tardar 14 días a partir de la fecha en la que se nos informe de su decisión de desistir del presente contrato.</p><p>Procederemos a efectuar dicho reembolso utilizando el mismo medio de pago empleado por usted para la transacción inicial, a no ser que haya usted dispuesto expresamente lo contrario; en todo caso, no incurrirá en ningún gasto como consecuencia del reembolso.</p><p>No exigimos ninguna compensación económica por el período transcurrido hasta el desistimiento.</p>`
    },
    {
      id: "formular",
      h: "8. Modelo de formulario de desistimiento",
      html: `<p>Solo debe cumplimentar y enviar el presente formulario si desea desistir del contrato.</p><ul><li>A la atención de: <b>${ENTITY.name}</b>, ${ENTITY.address}, correo electrónico: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de prestación del siguiente servicio: <b>LiczMat Pro (suscripción)</b>.</li><li>Pedido el (*)</li><li>Nombre del consumidor o de los consumidores</li><li>Domicilio del consumidor o de los consumidores</li><li>Firma del consumidor o de los consumidores, solo si el presente formulario se presenta en papel</li><li>Fecha</li></ul><p>(*) Táchese lo que no proceda.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Reembolso adicional en un plazo de 14 días",
      html: `<p>De forma adicional al derecho legal de desistimiento, reembolsamos el importe íntegro abonado a cualquier cliente, incluidos los empresarios, si el cliente desiste o cancela dentro de los 14 días posteriores a la primera compra de una suscripción a LiczMat Pro. Esta regla se aplica únicamente a la primera compra por cuenta y no se aplica a las renovaciones.</p>`
    },
    {
      id: "pflichten",
      h: "10. Obligaciones del cliente",
      html: `<ul><li>Proporciona datos exactos y completos y los mantiene actualizados.</li><li>Mantiene su contraseña en secreto y protege el acceso a su cuenta.</li><li>No incluye contenidos ilícitos en los presupuestos ni en los enlaces compartidos. Cualquier persona que conozca un enlace compartido de un presupuesto o proyecto puede ver su contenido.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Modificaciones de los servicios",
      html: `<p>Únicamente podremos modificar el servicio por una razón justificada, por ejemplo debido a nuevas disposiciones legales, por motivos de seguridad o debido al desarrollo técnico. La modificación no supondrá ningún coste adicional para usted. Le informaremos de manera clara y con la debida antelación.</p><p>Si una modificación menoscaba el acceso o el uso del consumidor de manera más que insignificante, este podrá rescindir el contrato de forma gratuita en un plazo de 30 días a partir de la recepción de la información o de la modificación, según lo que ocurra más tarde (§ 327r BGB).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Garantía legal y conformidad",
      html: `<p>Se aplican los derechos legales de garantía por defectos y falta de conformidad. Para los consumidores se aplican en particular los artículos 327 y siguientes del Código Civil alemán (BGB).</p>`
    },
    {
      id: "haftung",
      h: "13. Responsabilidad",
      html: `<p>Respondemos de forma ilimitada en caso de dolo o negligencia grave, en caso de daños contra la vida, la integridad física o la salud, así como en virtud de la Ley alemana de responsabilidad por productos defectuosos (Produkthaftungsgesetz).</p><p>En caso de negligencia leve, solo responderemos por el incumplimiento de una obligación contractual esencial. Las obligaciones contractuales esenciales, también denominadas obligaciones cardinales, son aquellas cuyo cumplimiento permite la debida ejecución del contrato y en cuya observancia el cliente confía habitualmente. En tal caso, la responsabilidad se limitará a los daños típicos del contrato y previsibles. En todos los demás supuestos, queda excluida la responsabilidad por negligencia leve.</p><p>La responsabilidad legal en virtud de los artículos 327 y siguientes del BGB permanece inalterada.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Modificaciones de precios",
      html: `<p>El precio de una suscripción vigente solo variará con su consentimiento expreso. Le informaremos con un mínimo de 30 días de antelación. Sin su consentimiento, la suscripción continuará al precio anterior. Cualquiera de las partes podrá darla por concluida al término del período ya abonado.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Modificaciones de las presentes condiciones",
      html: `<p>Las modificaciones de los presentes Términos y condiciones se aplicarán a un contrato en vigor únicamente con su consentimiento expreso. Le informaremos con un mínimo de 30 días de antelación. Sin su consentimiento, seguirán aplicándose las condiciones anteriores. Cualquiera de las partes podrá dar por concluida la suscripción al término del período ya abonado.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Protección de datos",
      html: `<p>Encontrará información sobre el tratamiento de datos personales en la <a href="/es/politica-de-privacidad/">Política de privacidad</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Resolución de litigios de consumo",
      html: `<p>No estamos dispuestos ni obligados a participar en procedimientos de resolución de litigios ante una junta arbitral de consumo (§ 36 VSBG).</p>`
    },
    {
      id: "schluss",
      h: "18. Disposiciones finales",
      html: `<p>Se aplica el derecho alemán, con exclusión de la Convención de las Naciones Unidas sobre los contratos de compraventa internacional de mercaderías. En el caso de los consumidores, esta elección de ley solo se aplica en la medida en que no les prive de la protección de las disposiciones imperativas del país de su residencia habitual.</p><p>Para los comerciantes, personas jurídicas de derecho público y patrimonios especiales de derecho público, el fuero competente corresponde al domicilio del proveedor.</p><p>En caso de que alguna disposición del presente contrato fuera o resultara nula, las demás disposiciones permanecerán vigentes.</p><p>La versión en alemán es vinculante. Las traducciones tienen un carácter meramente informativo.</p>`
    }
  ]
};
