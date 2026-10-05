import { ENTITY } from "../site.mjs";

export default {
  lang: "es",
  title: "Política de privacidad",
  updated: "2026-10-02",
  binding: false,
  translationNote: "Esta es una traducción. La versión en alemán es vinculante.",
  sections: [
    {
      id: "podejscie",
      h: "1. Enfoque sobre la privacidad",
      html: `<p>Esta política describe qué datos procesa la aplicación móvil <b>LiczMat, calculadora de materiales de construcción</b> («la Aplicación») y el sitio web <b>liczmat.com</b> («el Sitio web») y con qué fin. El responsable del tratamiento de datos es <b>${ENTITY.name}</b>, ${ENTITY.address} («nosotros»), contacto: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat funciona según el principio <b>offline-first</b>. Todos los cálculos se realizan en su dispositivo y funcionan sin internet. La base de datos local es la única fuente de verdad y la nube es solo una copia de esta.</p><p><b>Una cuenta es opcional.</b> No necesita iniciar sesión para realizar cálculos. Mientras no cree una cuenta, no enviamos sus proyectos ni cálculos a ningún servidor. Una copia de seguridad es un archivo que usted mismo exporta y guarda. Si decide crear una cuenta, los datos que se describen a continuación se enviarán a <b>Google Firebase</b>. Consulte la sección 3 para obtener más detalles.</p><p>La Aplicación también utiliza otros servicios de <b>Google</b> (anuncios y mapas / búsqueda de tiendas), que procesan determinados datos. Describimos esto a continuación.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Datos almacenados en el dispositivo",
      html: `<p>De forma local en su dispositivo almacenamos: proyectos, cálculos, listas de compras, habitaciones, materiales personalizados y ajustes (p. ej., idioma, moneda, tema, datos del contratista). Al desinstalar la Aplicación o borrar sus datos, esta información se elimina de forma permanente del dispositivo. Usted crea y conserva la copia de seguridad (exportación a un archivo) por sí mismo.</p><p><b>El catálogo de materiales, sus materiales y precios personalizados, así como los ajustes no se sincronizan.</b> Permanecen exclusivamente en el dispositivo, incluso si tiene una cuenta.</p>`
    },
    {
      id: "konto",
      h: "3. Cuenta de LiczMat y sincronización (opcional)",
      html: `<p>Puede crear una <b>cuenta de LiczMat</b> para tener los mismos proyectos en su teléfono inteligente y en el navegador (<a href="/app/">liczmat.com/app/</a>). La cuenta es gratuita y completamente voluntaria. Sin una cuenta, la Aplicación y el Sitio web funcionan como antes.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Qué datos procesamos cuando tiene una cuenta",
      html: `<ul><li><b>Dirección de correo electrónico y contraseña.</b> Gestionado por <b>Firebase Authentication</b>. No vemos ni almacenamos su contraseña, Google la almacena como un hash. La ventana de inicio de sesión de Google y las páginas a las que se accede a través de los enlaces de los correos electrónicos de la cuenta (p. ej., restablecimiento de contraseña, confirmación de correo electrónico) son proporcionadas por <b>auth.liczmat.com</b>, un servicio de Firebase Hosting (Google) dentro del mismo proyecto.</li><li><b>Inicio de sesión con Google</b> (alternativa opcional a la contraseña). En este caso no hay contraseña. Recibimos la dirección de correo electrónico, el nombre visible y un ID de cuenta de Google para vincularlos con sus datos en LiczMat (el nombre visible se usa en el correo electrónico de bienvenida). No obtenemos ningún otro dato de su cuenta de Google.</li><li><b>El ID de cuenta (UID)</b> asignado por Firebase.</li><li><b>Contenido de la cuenta:</b> proyectos, habitaciones, estimaciones y listas de compras. Nombres, cantidades, unidades, precios, moneda, datos ingresados en la calculadora, así como las marcas de tiempo de creación y modificación.</li><li><b>Datos técnicos:</b> fecha de creación de la cuenta, fecha de último uso y si se conecta a través de la Aplicación o el Sitio web.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Dónde se almacenan los datos",
      html: `<p>La base de datos de <b>Google Cloud Firestore</b> y los servicios de <b>Cloud Functions</b> se ejecutan en la región <b>europe-central2 (Varsovia)</b>, es decir, dentro de la Unión Europea. Sin embargo, el servicio de <b>Firebase Authentication</b> (sus datos de inicio de sesión, como la dirección de correo electrónico, el nombre visible, el hash de la contraseña y el ID de la cuenta de Google) se ejecuta en la infraestructura global de Google, por lo que estos datos pueden procesarse en los Estados Unidos (consulte la sección 8). Google actúa aquí como encargado del tratamiento en nuestro nombre.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Quién tiene acceso",
      html: `<p>Exclusivamente el titular de la cuenta. Las reglas de seguridad de Firestore permiten leer y escribir los datos de la cuenta solo al usuario que haya iniciado sesión con el mismo ID. La única excepción es un enlace que usted mismo crea. Consulte la sección 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Cómo funciona la sincronización",
      html: `<p>Después de cada cambio local, la Aplicación envía el documento a Firestore e importa los cambios de la nube a la base de datos del dispositivo. En caso de conflicto, prevalece la entrada más reciente (comparando las marcas de tiempo). La eliminación de un registro no lo elimina inmediatamente de la nube: el documento se marca como eliminado para que el otro dispositivo se entere de la eliminación y no lo restaure. Estas marcas se eliminan después de <b>30 días</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Compartir una estimación a través de un enlace",
      html: `<p>Si toca «Compartir», creamos una <b>copia</b> del proyecto seleccionado (nombre, estimaciones, lista de compras, moneda) en una dirección aleatoria de 128 bits liczmat.com/p/&lt;token&gt;. Esta copia es <b>públicamente legible para cualquier persona que conozca el enlace</b>. El token de la dirección es la única protección, por lo que solo debe compartirlo con las personas que deberían ver la estimación. La copia no se actualiza automáticamente, debe actualizarla de forma manual mediante un botón. La eliminación del enlace revoca el acceso de inmediato. La persona que abre el enlace no necesita una cuenta y no recopilamos ningún dato sobre ella, aparte de los análisis estándar del Sitio web (sección 6).</p>`
    },
    {
      id: "konto-calendar-link",
      h: "3.5.1. Enlace privado al calendario",
      html: `<p>Si creas un enlace privado al calendario, cualquiera que conozca esa dirección podrá leer las fechas abiertas de tu agenda, incluidos el nombre, la fecha, el cliente y la nota. Al crear un enlace nuevo, se desactiva el anterior.</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Cuánto tiempo conservamos los datos y cómo eliminarlos",
      html: `<p>Conservamos los datos de la cuenta mientras la cuenta exista. Puede eliminar proyectos individuales y habitaciones en cualquier momento. Puede eliminar toda la cuenta usted mismo en <a href="/app/">liczmat.com/app/</a> → pestaña <b>Cuenta</b> → <b>Eliminar cuenta</b>. Esto elimina todos los documentos de la cuenta en Firestore (proyectos, habitaciones, estimaciones, listas de compras y enlaces creados) y, finalmente, la cuenta en sí en Firebase Authentication. Esta acción no se puede deshacer. En la misma pestaña puede descargar todo el contenido de su cuenta por adelantado como un archivo JSON. Si desea que lo hagamos por usted, escriba a <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Los datos almacenados en su dispositivo o en su navegador deben eliminarse por separado borrando los datos de la Aplicación o los datos del sitio.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Base jurídica",
      html: `<p>El tratamiento de los datos de la cuenta es necesario para la ejecución del servicio que usted solicita. art. 6, apdo. 1, letra b) del RGPD (ejecución de un contrato). La creación de una cuenta es voluntaria, sin ella puede utilizar todas las funciones de la calculadora.</p>`
    },
    {
      id: "reklamy",
      h: "4. Anuncios (Google AdMob)",
      html: `<p>La Aplicación es gratuita y se financia con anuncios proporcionados por <b>Google AdMob</b>. Por lo tanto, Google, como proveedor de anuncios, puede recopilar y procesar:</p><ul><li><b>ID de publicidad</b> (Android Advertising ID),</li><li>dirección IP y datos del dispositivo (modelo, sistema operativo, ajustes de idioma),</li><li>ubicación aproximada (según la dirección IP),</li><li>información sobre la interacción con los anuncios (visualizaciones, clics).</li></ul><p>Estos datos se utilizan para mostrar anuncios, limitar su frecuencia, medir el rendimiento y evitar fraudes. Las políticas de Google lo describen: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Política de Google para sitios de socios</a> y <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Política de privacidad de Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Consentimiento (RGPD) y anuncios personalizados",
      html: `<p>Si se encuentra en el Espacio Económico Europeo, en el Reino Unido o en Suiza, al iniciar por primera vez mostramos una ventana de consentimiento (Google User Messaging Platform), donde decide sobre los anuncios personalizados. Sin su consentimiento, solo se muestran anuncios <b>no personalizados</b>. Puede cambiar o retirar su consentimiento en cualquier momento borrando los datos de la aplicación en los ajustes del sistema o restableciendo el ID de publicidad en los ajustes de Android. La base legal para los anuncios personalizados es el consentimiento, art. 6(1)(a) RGPD, y para leer o almacenar información en el dispositivo además el § 25(1) TDDDG (ley alemana de protección de datos en telecomunicaciones y servicios digitales). Anuncios no personalizados: interés legítimo en financiar la aplicación gratuita, art. 6(1)(f) RGPD.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Análisis de la aplicación (Firebase / Google Analytics)",
      html: `<p>La Aplicación utiliza <b>Google Analytics for Firebase</b> para medir de forma anónima y agregada cómo se utilizan sus funciones (p. ej., qué calculadoras abre, la cantidad de usuarios activos). Esto nos ayuda a mejorar LiczMat. Los análisis están <b>desactivados</b> por defecto y solo se activan después de que haya otorgado su consentimiento en la misma ventana (Google User Messaging Platform). Sin consentimiento, no se recopila nada. Los datos son procesados por Google de acuerdo con la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Política de privacidad de Google</a>. La base legal es el consentimiento, art. 6(1)(a) RGPD y § 25(1) TDDDG; el consentimiento puede ser retirado en cualquier momento con efecto para el futuro.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Ubicación y búsqueda de tiendas (Google Maps / Places)",
      html: `<p>La función «Buscar una tienda» utiliza <b>Google Maps</b> y <b>Google Places</b>. Si otorga el permiso de acceso a la ubicación, la Aplicación utiliza su ubicación aproximada o precisa para mostrar tiendas de materiales de construcción cercanas y calcular la ruta. Las solicitudes a los servicios de mapas son procesadas por Google de acuerdo con su política de privacidad. Puede rechazar el acceso a la ubicación. En ese caso, no se buscarán tiendas automáticamente, pero todas las demás funciones operarán sin cambios. No almacenamos su ubicación, ni en el dispositivo ni en la cuenta.</p>`
    },
    {
      id: "strona",
      h: "6. El Sitio web",
      html: `<p>El sitio web <b>liczmat.com</b> es estático. Cuando se abre el sitio, el host GitHub Pages (GitHub, Inc.) procesa los datos de registro estándar del servidor (dirección IP, hora, página solicitada, navegador) para entregar el sitio de forma segura; base legal art. 6(1)(f) RGPD (interés legítimo en un sitio web seguro y confiable). Utiliza <b>Google Analytics</b> (GA4) para medir de forma anónima y agregada el tráfico (p. ej., cuántas personas visitan el Sitio web y cuántas hacen clic en Google Play), para que podamos mejorarlo. Los análisis están desactivados por defecto: de acuerdo con el RGPD, primero solicitamos su consentimiento, y Google Analytics (incluido el establecimiento de cookies) solo se inicia después de que lo haya otorgado. Puede rechazarlo y todas las demás funciones seguirán pudiendo utilizarse. La base legal es el consentimiento, art. 6(1)(a) RGPD y § 25(1) TDDDG; retirada en cualquier momento a través de la configuración de cookies/consentimiento en el sitio, con efecto para el futuro. Aparte de Analytics, el Sitio web no utiliza fuentes web. El resto del código y los estilos se proporcionan desde el dominio del Sitio web y las calculadoras interactivas realizan cálculos exclusivamente en su navegador.</p><p>Las excepciones son los lugares donde se integran servicios externos. <b>Tiendas:</b> El Sitio web incorpora un mapa de <b>Google Maps</b>, que se carga desde los servidores de Google. Si comparte su ubicación, solo se usa para centrar el mapa y no se almacena en ningún lugar. Para mostrar la lista de las tiendas más cercanas, el Sitio web envía sus coordenadas aproximadas al servicio <b>OpenStreetMap (Overpass API)</b> y obtiene datos públicos de las tiendas. El botón «Navegar» abre la ruta en Google Maps. Las sugerencias de ciudades basadas en códigos postales utilizan una base de datos GeoNames (geonames.org), CC BY 4.0, alojada directamente en nuestro servidor, y ningún tercero recibe el código postal introducido. La base legal es el art. 6(1)(a) RGPD cuando el visitante comparte la ubicación, de lo contrario, el mapa se carga solo cuando el visitante abre el buscador de tiendas. <b>/app/:</b> Después de iniciar sesión, el Sitio web se conecta a <b>Firebase</b> (Authentication y Firestore) en las condiciones de la sección 3 y almacena los datos de inicio de sesión en el navegador para que no se le pida una contraseña en cada visita. <b>/p/&lt;token&gt;:</b> El Sitio web obtiene la copia compartida de una estimación de Firestore sin iniciar sesión y sin recopilar datos sobre la persona que abre el enlace. Ambas subpáginas están excluidas de la indexación.</p><p><b>Los proyectos, habitaciones y estimaciones guardados en el Sitio web sin iniciar sesión</b> permanecen exclusivamente en el almacenamiento local de su navegador (localStorage) y no se envían a ningún lado. No los vemos y no tenemos acceso a ellos. Se eliminan borrando los datos del sitio en su navegador. Solo van a la nube cuando inicia sesión en su cuenta y hace clic en «Enviar desde el navegador a la cuenta» usted mismo. A partir de ese momento se aplica la sección 3. También almacenamos su elección de idioma, elección de moneda, elección de tema y su decisión con respecto al consentimiento para los análisis en el navegador.</p>`
    },
    {
      id: "komu",
      h: "7. Con quién compartimos los datos",
      html: `<p>No vendemos datos ni creamos perfiles de usuario. Los datos descritos anteriormente son procesados por <b>Google</b> como encargado del tratamiento: AdMob (anuncios), Maps y Places (mapas y tiendas), Analytics (estadísticas) y, si crea una cuenta, Firebase Authentication, Cloud Firestore y Firebase Hosting (cuenta y sincronización). Además, después de crear la cuenta, le enviamos un correo electrónico de bienvenida único a su dirección de correo electrónico en el idioma de la página en la que se creó la cuenta. Este correo electrónico es procesado y enviado a través de los servidores de <b>OVH SAS</b> (Francia, UE), nuestro proveedor de servicios de correo electrónico, actuando como encargado del tratamiento en nuestro nombre, de conformidad con el art. 6, apdo. 1, letra b) del RGPD. Por lo demás, solo compartimos los datos con las personas a las que usted mismo les proporciona el enlace de estimación (sección 3.5) y cuando la ley aplicable lo requiera.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Pagos (Stripe)",
      html: `<p>La suscripción <b>LiczMat Pro</b> es gestionada por <b>Stripe</b> (Stripe Payments Europe, Ltd., Irlanda). Si decide adquirirla, se le redirigirá a la página de pago de Stripe. Stripe, como responsable independiente, recibe y procesa los datos de pago: número de tarjeta, datos de facturación e historial de pagos. <b>No vemos ni almacenamos su número de tarjeta.</b> Su dirección de correo electrónico y el ID de cuenta (UID) se envían a Stripe para que la suscripción de pago pueda asignarse a la cuenta correcta. A cambio, solo recibimos el estado del plan (Gratuito o Pro), su fecha de caducidad y si la suscripción se renovará. Usted administra sus facturas, cambios de tarjeta y cancelaciones en el portal de clientes de Stripe. La política de privacidad de Stripe está disponible en: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Transferencia de datos fuera del EEE",
      html: `<p>Google LLC (responsable de Firebase Authentication, Google Analytics, AdMob, Maps, Places y Firebase Hosting) y GitHub, Inc. (que aloja nuestro sitio web y procesa registros de servidor estándar, incluidas las direcciones IP) son empresas estadounidenses. La transferencia de sus datos a los EE. UU. se basa en la <b>decisión de adecuación de la Comisión Europea para el EU-US Data Privacy Framework</b>, ya que ambas empresas están certificadas. Además, se basa en <b>cláusulas contractuales tipo</b> incluidas en sus condiciones de procesamiento de datos (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Sus derechos (RGPD)",
      html: `<p>En virtud del RGPD, tiene derecho al acceso, la rectificación, la supresión, la limitación del tratamiento, la portabilidad de los datos y la oposición, así como el derecho a retirar su consentimiento para anuncios personalizados y análisis. <b>Cuando el tratamiento se base en el art. 6(1)(f) RGPD, puede oponerse en cualquier momento por motivos relacionados con su situación particular (art. 21 RGPD).</b></p><p>Usted controla directamente los datos que permanecen en el dispositivo (datos de la aplicación, permisos, ID de publicidad en los ajustes de Android). Puede revisar y cambiar los datos de la cuenta en la Aplicación o en <a href="/app/">liczmat.com/app/</a>, exportarlos a través de la función de copia de seguridad y eliminarlos eliminando registros individuales o solicitando la eliminación de toda la cuenta (sección 3.6). Para preguntas relacionadas con sus datos, escriba a: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. También tiene derecho a presentar una reclamación ante la autoridad de control competente: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, o ante la autoridad de control de protección de datos de su país de residencia dentro de la UE.</p>`
    },
    {
      id: "dzieci",
      h: "10. Niños",
      html: `<p>La Aplicación no está dirigida a niños y no recopilamos conscientemente datos de personas menores de 13 años. Una cuenta de LiczMat está destinada a personas mayores de 16 años, o que cuenten con el consentimiento de sus representantes legales.</p>`
    },
    {
      id: "zmiany",
      h: "11. Cambios y contacto",
      html: `<p>Podemos actualizar esta política. Notificaremos los cambios significativos en la Aplicación o en Google Play. La fecha de la última actualización se encuentra en la parte superior del documento. Contacto: <b>${ENTITY.name}</b>, correo electrónico: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
