import { ENTITY } from "../site.mjs";

export default {
  lang: "fr",
  title: "Politique de confidentialité",
  updated: "2026-10-02",
  binding: false,
  translationNote: "Ceci est une traduction. La version allemande fait foi.",
  sections: [
    {
      id: "podejscie",
      h: "1. Approche de la confidentialité",
      html: `<p>Cette politique décrit quelles données sont traitées par l'application mobile <b>LiczMat, calculatrice pour matériaux de construction</b> (« l'Application ») et le site web <b>liczmat.com</b> (« le Site web ») et dans quel but. Le responsable du traitement des données est <b>${ENTITY.name}</b>, ${ENTITY.address} (« nous »), contact : <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat fonctionne selon le principe <b>offline-first</b>. Tous les calculs sont effectués sur votre appareil et fonctionnent sans internet. La base de données locale est la seule source de vérité et le cloud n'en est qu'une copie.</p><p><b>Un compte est facultatif.</b> Vous n'avez pas besoin de vous connecter pour effectuer des calculs. Tant que vous ne créez pas de compte, nous n'envoyons vos projets ou calculs à aucun serveur. Une sauvegarde est un fichier que vous exportez et enregistrez vous-même. Si vous choisissez de créer un compte, les données décrites ci-dessous seront envoyées à <b>Google Firebase</b>. Consultez la section 3 pour plus de détails.</p><p>L'Application utilise également d'autres services <b>Google</b> (annonces et cartes / recherche de magasins), qui traitent certaines données. Nous décrivons cela ci-dessous.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Données stockées sur l'appareil",
      html: `<p>Localement sur votre appareil, nous stockons : les projets, les calculs, les listes de courses, les pièces, les matériaux personnalisés et les paramètres (par ex., langue, devise, thème, coordonnées de l'entrepreneur). La désinstallation de l'Application ou l'effacement de ses données supprime définitivement ces informations de l'appareil. Vous créez et conservez la sauvegarde (exportation vers un fichier) vous-même.</p><p><b>Le catalogue de matériaux, vos matériaux et prix personnalisés, ainsi que les paramètres ne sont pas synchronisés.</b> Ils restent exclusivement sur l'appareil, même si vous avez un compte.</p>`
    },
    {
      id: "konto",
      h: "3. Compte LiczMat et synchronisation (facultatif)",
      html: `<p>Vous pouvez créer un <b>compte LiczMat</b> pour avoir les mêmes projets sur votre smartphone et dans votre navigateur (<a href="/app/">liczmat.com/app/</a>). Le compte est gratuit et totalement volontaire. Sans compte, l'Application et le Site web fonctionnent comme avant.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. Quelles données nous traitons lorsque vous avez un compte",
      html: `<ul><li><b>Adresse e-mail et mot de passe.</b> Géré par <b>Firebase Authentication</b>. Nous ne voyons ni ne stockons votre mot de passe, Google le stocke sous forme de hachage. La fenêtre de connexion Google et les pages accessibles via les liens dans les e-mail du compte (par ex., réinitialisation du mot de passe, confirmation de l'e-mail) sont fournies par <b>auth.liczmat.com</b>, un service Firebase Hosting (Google) au sein du même projet.</li><li><b>Connexion avec Google</b> (alternative facultative au mot de passe). Dans ce cas, il n'y a pas de mot de passe. Nous recevons l'adresse e-mail, le nom d'affichage et un ID de compte de la part de Google pour les lier à vos données dans LiczMat (le nom d'affichage est utilisé dans l'e-mail de bienvenue). Nous ne récupérons aucune autre donnée de votre compte Google.</li><li><b>L'ID de compte (UID)</b> attribué par Firebase.</li><li><b>Contenu du compte :</b> projets, pièces, devis et listes de courses. Noms, quantités, unités, prix, devise, données saisies dans la calculatrice, ainsi que les horodatages de création et de modification.</li><li><b>Données techniques :</b> date de création du compte, date de dernière utilisation et si vous vous connectez via l'Application ou le Site web.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Où les données sont stockées",
      html: `<p>La base de données <b>Google Cloud Firestore</b> et les services <b>Cloud Functions</b> fonctionnent dans la région <b>europe-central2 (Varsovie)</b>, c'est-à-dire au sein de l'Union européenne. Cependant, le service <b>Firebase Authentication</b> (vos données de connexion, telles que l'adresse e-mail, le nom d'affichage, le hachage du mot de passe et l'ID du compte Google) fonctionne sur l'infrastructure mondiale de Google, ces données peuvent donc être traitées aux États-Unis (voir section 8). Google agit ici en tant que sous-traitant en notre nom.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Qui y a accès",
      html: `<p>Exclusivement le propriétaire du compte. Les règles de sécurité de Firestore n'autorisent la lecture et l'écriture des données du compte qu'à l'utilisateur connecté avec le même ID. La seule exception est un lien que vous créez vous-même. Voir section 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. Comment fonctionne la synchronisation",
      html: `<p>Après chaque modification locale, l'Application envoie le document à Firestore et télécharge les modifications depuis le cloud vers la base de données de l'appareil. En cas de conflit, l'entrée la plus récente l'emporte (en comparant les horodatages). La suppression d'un enregistrement ne le supprime pas immédiatement du cloud : le document est marqué comme supprimé afin que l'autre appareil soit informé de la suppression et ne le restaure pas. Ces marques sont supprimées après <b>30 jours</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Partage d'un devis via un lien",
      html: `<p>Si vous appuyez sur « Partager », nous créons une <b>copie</b> du projet sélectionné (nom, devis, liste de courses, devise) à une adresse aléatoire de 128 bits liczmat.com/p/&lt;token&gt;. Cette copie est <b>publiquement lisible par toute personne connaissant le lien</b>. Le jeton dans l'adresse est la seule protection, ne le partagez donc qu'avec les personnes qui devraient voir le devis. La copie ne se met pas à jour automatiquement, vous devez la mettre à jour manuellement via un bouton. La suppression du lien révoque immédiatement l'accès. La personne qui ouvre le lien n'a pas besoin de compte et nous ne collectons aucune donnée à son sujet, à part les analyses standard du Site web (section 6).</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. Combien de temps nous conservons les données et comment les supprimer",
      html: `<p>Nous conservons les données du compte tant que le compte existe. Vous pouvez supprimer des projets individuels et des pièces à tout moment. Vous pouvez supprimer le compte entier vous-même sur <a href="/app/">liczmat.com/app/</a> → onglet <b>Compte</b> → <b>Supprimer le compte</b>. Cela supprime tous les documents du compte dans Firestore (projets, pièces, devis, listes de courses et liens créés) et enfin le compte lui-même dans Firebase Authentication. Cette action ne peut pas être annulée. Dans le même onglet, vous pouvez télécharger au préalable l'intégralité du contenu de votre compte sous forme de fichier JSON. Si vous souhaitez que nous le fassions pour vous, écrivez à <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Les données stockées sur votre appareil ou dans votre navigateur doivent être supprimées séparément en effaçant les données de l'Application ou les données du site.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Base juridique",
      html: `<p>Le traitement des données du compte est nécessaire à l'exécution du service que vous demandez. art. 6, paragraphe 1, point b) du RGPD (exécution d'un contrat). La création d'un compte est volontaire, sans cela vous pouvez utiliser toutes les fonctions de la calculatrice.</p>`
    },
    {
      id: "reklamy",
      h: "4. Annonces (Google AdMob)",
      html: `<p>L'Application est gratuite et est financée par des annonces fournies par <b>Google AdMob</b>. Par conséquent, Google, en tant que fournisseur d'annonces, peut collecter et traiter :</p><ul><li><b>l'identifiant publicitaire</b> (Android Advertising ID),</li><li>l'adresse IP et les données de l'appareil (modèle, système d'exploitation, paramètres de langue),</li><li>l'emplacement approximatif (basé sur l'adresse IP),</li><li>les informations sur l'interaction avec les annonces (vues, clics).</li></ul><p>Ces données sont utilisées pour diffuser des annonces, limiter leur fréquence, mesurer les performances et prévenir la fraude. Les règles de Google le décrivent : <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Règles de Google pour les sites partenaires</a> et <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Règles de confidentialité de Google</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Consentement (RGPD) et annonces personnalisées",
      html: `<p>Si vous vous trouvez dans l'Espace économique européen, au Royaume-Uni ou en Suisse, lors du premier lancement, nous affichons une fenêtre de consentement (Google User Messaging Platform), où vous décidez des annonces personnalisées. Sans votre consentement, seules des annonces <b>non personnalisées</b> sont diffusées. Vous pouvez modifier ou retirer votre consentement à tout moment en effaçant les données de l'application dans les paramètres du système ou en réinitialisant l'identifiant publicitaire dans les paramètres Android. La base légale pour les annonces personnalisées est le consentement, art. 6(1)(a) RGPD, et pour la lecture ou le stockage d'informations sur l'appareil, en outre, le § 25(1) TDDDG (loi allemande sur la protection des données dans les télécommunications et les services numériques). Annonces non personnalisées : intérêt légitime à financer l'application gratuite, art. 6(1)(f) RGPD.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. Analyses de l'application (Firebase / Google Analytics)",
      html: `<p>L'Application utilise <b>Google Analytics for Firebase</b> pour mesurer de manière anonyme et agrégée comment ses fonctionnalités sont utilisées (par ex., quelles calculatrices vous ouvrez, le nombre d'utilisateurs actifs). Cela nous aide à améliorer LiczMat. Les analyses sont <b>désactivées</b> par défaut et ne sont activées qu'après que vous ayez donné votre consentement dans la même fenêtre (Google User Messaging Platform). Sans consentement, rien n'est collecté. Les données sont traitées par Google conformément aux <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Règles de confidentialité de Google</a>. La base légale est le consentement, art. 6(1)(a) RGPD et § 25(1) TDDDG ; le consentement peut être retiré à tout moment avec effet pour l'avenir.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Emplacement et recherche de magasins (Google Maps / Places)",
      html: `<p>La fonction « Trouver un magasin » utilise <b>Google Maps</b> et <b>Google Places</b>. Si vous accordez l'autorisation d'accès à la position, l'Application utilise votre emplacement approximatif ou précis pour afficher les magasins de matériaux de construction à proximité et calculer l'itinéraire. Les demandes adressées aux services de cartographie sont traitées par Google conformément à leurs règles de confidentialité. Vous pouvez refuser l'accès à la position. Dans ce cas, les magasins ne seront pas recherchés automatiquement, mais toutes les autres fonctions fonctionneront sans modification. Nous ne stockons pas votre emplacement, ni sur l'appareil ni dans le compte.</p>`
    },
    {
      id: "strona",
      h: "6. Le Site web",
      html: `<p>Le site web <b>liczmat.com</b> est statique. Lors de l'ouverture du site, l'hôte GitHub Pages (GitHub, Inc.) traite les données de journal de serveur standard (adresse IP, heure, page demandée, navigateur) pour fournir le site en toute sécurité ; base légale art. 6(1)(f) RGPD (intérêt légitime pour un site web sûr et fiable). Il utilise <b>Google Analytics</b> (GA4) pour mesurer de manière anonyme et agrégée le trafic (par ex., combien de personnes visitent le Site web et combien cliquent vers Google Play), afin que nous puissions l'améliorer. Les analyses sont désactivées par défaut : conformément au RGPD, nous demandons d'abord votre consentement, et Google Analytics (y compris le paramétrage des cookies) ne démarre qu'après que vous l'ayez accordé. Vous pouvez refuser, et toutes les autres fonctions resteront utilisables. La base légale est le consentement, art. 6(1)(a) RGPD et § 25(1) TDDDG ; retrait à tout moment via le paramètre de cookies/consentement sur le site, avec effet pour l'avenir. En dehors d'Analytics, le Site web n'utilise pas de polices web. Tout le reste du code et des styles sont fournis à partir du domaine du Site web, et les calculatrices interactives effectuent des calculs exclusivement dans votre navigateur.</p><p>Les exceptions sont les endroits où des services externes sont intégrés. <b>Magasins :</b> Le Site web intègre une carte <b>Google Maps</b>, qui est chargée à partir des serveurs de Google. Si vous partagez votre emplacement, il n'est utilisé que pour centrer la carte et n'est stocké nulle part. Pour afficher la liste des magasins les plus proches, le Site web envoie vos coordonnées approximatives au service <b>OpenStreetMap (Overpass API)</b> et récupère les données publiques des magasins. Le bouton « Naviguer » ouvre l'itinéraire dans Google Maps. Les suggestions de villes basées sur les codes postaux utilisent une base de données GeoNames (geonames.org), CC BY 4.0, hébergée directement sur notre serveur, et aucun tiers ne reçoit le code postal saisi. La base légale est l'art. 6(1)(a) RGPD lorsque le visiteur partage l'emplacement, sinon la carte ne se charge que lorsque le visiteur ouvre la recherche de magasins. <b>/app/ :</b> Après la connexion, le Site web se connecte à <b>Firebase</b> (Authentification et Firestore) aux conditions de la section 3 et stocke les données de connexion dans le navigateur afin qu'un mot de passe ne vous soit pas demandé à chaque visite. <b>/p/&lt;token&gt; :</b> Le Site web récupère la copie partagée d'un devis depuis Firestore sans connexion et sans collecter de données sur la personne qui ouvre le lien. Ces deux sous-pages sont exclues de l'indexation.</p><p><b>Les projets, pièces et devis enregistrés sur le Site web sans connexion</b> restent exclusivement dans le stockage local de votre navigateur (localStorage) et ne sont envoyés nulle part. Nous ne les voyons pas et n'y avons pas accès. Vous les supprimez en effaçant les données du site dans votre navigateur. Ils ne vont dans le cloud que lorsque vous vous connectez à votre compte et cliquez vous-même sur « Envoyer du navigateur vers le compte ». À partir de ce moment, la section 3 s'applique. Nous stockons également votre choix de langue, votre choix de devise, votre choix de thème et votre décision concernant le consentement aux analyses dans le navigateur.</p>`
    },
    {
      id: "komu",
      h: "7. Avec qui nous partageons les données",
      html: `<p>Nous ne vendons pas de données et nous ne créons pas de profils d'utilisateurs. Les données décrites ci-dessus sont traitées par <b>Google</b> en tant que sous-traitant : AdMob (annunci), Maps et Places (cartes et magasins), Analytics (statistiques) et, si vous créez un compte, Firebase Authentication, Cloud Firestore et Firebase Hosting (compte et synchronisation). De plus, après la création du compte, nous envoyons un e-mail de bienvenue unique à votre adresse e-mail dans la langue de la page sur laquelle le compte a été créé. Cet e-mail est traité et envoyé via les serveurs d'<b>OVH SAS</b> (France, UE), notre fournisseur de services de messagerie, agissant en tant que sous-traitant en notre nom, sur la base de l'art. 6, paragraphe 1, point b) du RGPD. Autrement, nous ne partageons les données qu'avec les personnes à qui vous fournissez vous-même le lien du devis (section 3.5) et lorsque la loi applicable l'exige.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Paiements (Stripe)",
      html: `<p>L'abonnement <b>LiczMat Pro</b> est géré par <b>Stripe</b> (Stripe Payments Europe, Ltd., Irlande). Si vous décidez de l'acheter, vous serez redirigé vers la page de paiement de Stripe. Stripe, en tant que responsable de traitement indépendant, reçoit et traite les données de paiement : numéro de carte, détails de facturation et historique des paiements. <b>Nous ne voyons ni ne stockons votre numéro de carte.</b> Votre adresse e-mail et l'ID de compte (UID) sont envoyés à Stripe afin que l'abonnement payant puisse être attribué au bon compte. En retour, nous ne recevons que le statut du forfait (Gratuit ou Pro), sa date d'expiration et si l'abonnement sera renouvelé. Vous gérez vos factures, vos modifications de carte et vos annulations dans le portail client de Stripe. La politique de confidentialité de Stripe est disponible sur : <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Transfert de données en dehors de l'EEE",
      html: `<p>Google LLC (responsable de Firebase Authentication, Google Analytics, AdMob, Maps, Places et Firebase Hosting) et GitHub, Inc. (qui héberge notre site web et traite les journaux de serveur standard, y compris les adresses IP) sont des entreprises américaines. Le transfert de vos données vers les États-Unis est basé sur <b>la décision d'adéquation de la Commission européenne pour l'EU-US Data Privacy Framework</b>, car les deux sociétés sont certifiées. De plus, il est basé sur des <b>clauses contractuelles types</b> incluses dans leurs conditions de traitement des données (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Vos droits (RGPD)",
      html: `<p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité des données et d'opposition, ainsi que du droit de retirer votre consentement pour les annonces personnalisées et les analyses. <b>Lorsque le traitement est fondé sur l'art. 6(1)(f) RGPD, vous pouvez vous y opposer à tout moment pour des raisons tenant à votre situation particulière (art. 21 RGPD).</b></p><p>Vous contrôlez directement les données qui restent sur l'appareil (données de l'application, autorisations, identifiant publicitaire dans les paramètres Android). Vous pouvez consulter et modifier les données du compte dans l'Application ou sur <a href="/app/">liczmat.com/app/</a>, les exporter via la fonction de sauvegarde et les supprimer en supprimant des entrées individuelles ou en demandant la suppression de l'ensemble du compte (section 3.6). Pour toute question concernant vos données, écrivez à : <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. Vous avez également le droit de déposer une plainte auprès de l'autorité de contrôle compétente : <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, ou auprès de l'autorité de contrôle de la protection des données de votre pays de résidence au sein de l'UE.</p>`
    },
    {
      id: "dzieci",
      h: "10. Enfants",
      html: `<p>L'Application ne s'adresse pas aux enfants et nous ne collectons pas sciemment de données auprès de personnes de moins de 13 ans. Un compte LiczMat est destiné aux personnes âgées de 16 ans ou plus, ou avec le consentement de leurs représentants légaux.</p>`
    },
    {
      id: "zmiany",
      h: "11. Modifications et contact",
      html: `<p>Nous pouvons mettre à jour cette politique. Nous notifierons les modifications importantes dans l'Application ou sur Google Play. La date de la dernière mise à jour se trouve en haut du document. Contact : <b>${ENTITY.name}</b>, e-mail : <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
