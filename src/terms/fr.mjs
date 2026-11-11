import { ENTITY } from "../site.mjs";

export default {
  lang: "fr",
  title: "Conditions générales pour LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "Ceci est une traduction. La version allemande fait foi.",
  sections: [
    {
      id: "anbieter",
      h: "1. Fournisseur et champ d'application",
      html: `<p>Le fournisseur de LiczMat Pro est <b>${ENTITY.name}</b>, ${ENTITY.address}, téléphone : <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, courrier électronique : <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, n° de TVA intracommunautaire : ${ENTITY.taxId}.</p><p>Les présentes Conditions générales s'appliquent à l'abonnement payant <b>LiczMat Pro</b>, proposé sur liczmat.com pour l'application web à l'adresse <a href="/app/">liczmat.com/app/</a>. Les calculateurs gratuits sur liczmat.com, l'application Android et le compte gratuit LiczMat sont fournis à titre gracieux et ne font pas partie du contrat payant.</p><p>Au sens de l'article 13 du Code civil allemand (BGB), un consommateur est toute personne physique qui conclut un acte juridique à des fins qui n'entrent majoritairement ni dans le cadre de son activité commerciale ni dans celui de son activité professionnelle indépendante. Au sens de l'article 14 du BGB, un professionnel est une personne physique ou morale ou une société de personnes jouissant de la capacité juridique qui, lors de la conclusion du contrat, agit dans le cadre de son activité commerciale ou professionnelle indépendante.</p><p>Les conditions générales propres au client ne s'appliquent pas.</p>`
    },
    {
      id: "leistung",
      h: "2. Prestation de services",
      html: `<p>LiczMat Pro met à votre disposition en ligne dans votre navigateur les fonctionnalités Pro telles que décrites sur la <a href="/fr/liczmat-pro/">page LiczMat Pro</a> au moment de la commande. Celles-ci comprennent notamment la gestion des clients, les devis au format PDF et avec lien de partage, la planification des échéances, les prix et coûts dans les projets ainsi que l'enregistrement des coordonnées de l'entreprise. LiczMat enregistre dans votre compte les données que vous saisissez.</p><p>Les calculs et les devis établis à partir de ceux-ci sont des aides. Il vous appartient de vérifier les quantités, les prix, les résultats et l'adéquation à l'usage prévu avant d'acheter des matériaux ou de soumettre un devis.</p><p>Une disponibilité ininterrompue n'est pas garantie. Des travaux de maintenance, des perturbations techniques et des pannes peuvent survenir. Nous nous efforçons de limiter au maximum ces restrictions.</p>`
    },
    {
      id: "test",
      h: "3. Période d'essai gratuite",
      html: `<p>Les nouveaux comptes bénéficient de LiczMat Pro <b>gratuitement pendant 14 jours</b>. Aucune coordonnée de paiement n'est requise. La période d'essai prend fin automatiquement et ne se transforme pas en abonnement payant. À son expiration, le compte revient à l'offre gratuite.</p>`
    },
    {
      id: "vertrag",
      h: "4. Conclusion du contrat",
      html: `<p>La présentation de LiczMat Pro sur le site web ne constitue pas une offre ferme de conclusion de contrat.</p><p>Pour passer commande, vous vous connectez à <a href="/app/">liczmat.com/app/</a>, choisissez l'abonnement mensuel ou annuel et cliquez sur le bouton d'achat. Vous êtes redirigé vers la page de paiement de Stripe. Vous y saisissez votre adresse e-mail et vos coordonnées de paiement. Avant le clic final, vous pouvez vérifier et corriger toutes les informations saisies. Le contrat est conclu lorsque vous cliquez sur le bouton confirmant la souscription de l'abonnement payant.</p><p>Le prestataire de services de paiement est Stripe Payments Europe, Limited (Irlande). Stripe confirme la conclusion du contrat par courrier électronique.</p><p>Le contrat peut être conclu dans l'une des 13 langues proposées sur le site web. La version allemande fait foi. Nous ne conservons pas le texte du contrat séparément. Les présentes Conditions générales sont disponibles à tout moment à cette adresse et peuvent être enregistrées ou imprimées. Les reçus et factures sont disponibles dans le portail client de Stripe.</p>`
    },
    {
      id: "preise",
      h: "5. Prix et paiement",
      html: `<p>Les prix applicables sont ceux affichés sur la <a href="/fr/liczmat-pro/">page LiczMat Pro</a> et sur la page de paiement au moment de la commande. Il s'agit de prix définitifs. Aucun frais supplémentaire n'est facturé. La facturation s'effectue dans la devise indiquée lors du paiement.</p><p>Le prix est facturé d'avance pour la période concernée, un mois ou un an, et est prélevé automatiquement au début de chaque période via le moyen de paiement sélectionné. Les modes de paiement proposés lors de la commande sont disponibles.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Durée et résiliation",
      html: `<h3>6.1. Abonnement mensuel</h3><p>L'abonnement mensuel a une durée d'un mois. Il est renouvelé à chaque fois pour un mois supplémentaire s'il n'est pas résilié. Vous pouvez le résilier à tout moment avec effet à la fin du mois contractuel en cours.</p><h3>6.2. Abonnement annuel</h3><p>La durée initiale est d'un an. Vous pouvez résilier l'abonnement à tout moment avec effet à la fin de cette année. Sans résiliation, il se poursuit pour une durée indéterminée après la première année et peut alors être résilié à tout moment avec un préavis d'un mois. La facturation continue de s'effectuer annuellement à l'avance. Nous remboursons au prorata tout montant déjà versé pour la période postérieure à la fin du contrat.</p><h3>6.3. Modalités de résiliation</h3><p>Vous pouvez résilier l'abonnement dans le portail client via la section <b>Compte</b> à l'adresse <a href="/app/">liczmat.com/app/</a>, via le bouton <a href="/fr/resilier-contrat/">« Résilier des contrats ici »</a>, par courrier électronique à <a href="mailto:${ENTITY.email}">${ENTITY.email}</a> ou par courrier postal à ${ENTITY.name}, ${ENTITY.address}. Le droit de résiliation pour motif légitime demeure inchangé.</p><h3>6.4. Conséquences de la fin du contrat</h3><p>Après la fin du contrat, le compte revient à l'offre gratuite. Vos données restent enregistrées dans le compte. Les fonctionnalités Pro ne sont plus disponibles jusqu'à ce que LiczMat Pro soit de nouveau commandé. Vous trouverez des informations relatives à la suppression du compte dans la <a href="/fr/politique-de-confidentialite/">Politique de confidentialité</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Informations sur l'exercice du droit de rétractation",
      html: `<p>Le droit légal de rétractation suivant s'applique uniquement aux consommateurs.</p><h3>Droit de rétractation</h3><p>Vous avez le droit de vous rétracter du présent contrat sans donner de motif dans un délai de quatorze jours.</p><p>Le délai de rétractation expire quatorze jours après le jour de la conclusion du contrat.</p><p>Pour exercer le droit de rétractation, vous devez nous notifier, <b>${ENTITY.name}</b>, ${ENTITY.address}, téléphone : <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, courrier électronique : <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, votre décision de rétractation du présent contrat au moyen d'une déclaration dénuée d'ambiguïté, par exemple, lettre envoyée par la poste ou courrier électronique.</p><p>Vous pouvez utiliser le modèle de formulaire de rétractation ci-dessous ou la fonction de rétractation sur la page <a href="/fr/retractation/">« Se rétracter du contrat ici »</a>, mais ce n'est pas obligatoire. Si vous utilisez cette option en ligne, nous vous transmettrons sans délai un accusé de réception de la rétractation sur un support durable, par exemple par courrier électronique, comprenant son contenu ainsi que la date et l'heure de sa transmission.</p><p>Pour que le délai de rétractation soit respecté, il suffit que vous transmettiez votre communication relative à l'exercice du droit de rétractation avant l'expiration du délai de rétractation.</p><h3>Effets de la rétractation</h3><p>En cas de rétractation de votre part du présent contrat, nous vous rembourserons tous les paiements reçus de vous sans retard excessif et, en tout état de cause, au plus tard quatorze jours à compter du jour où nous sommes informés de votre décision de rétractation du présent contrat.</p><p>Nous procéderons au remboursement en utilisant le même moyen de paiement que celui que vous avez utilisé pour la transaction initiale, sauf si vous convenez expressément d'un moyen différent ; en tout état de cause, ce remboursement n'occasionnera pas de frais pour vous.</p><p>Nous n'exigeons aucun paiement pour la période précédant la rétractation.</p>`
    },
    {
      id: "formular",
      h: "8. Modèle de formulaire de rétractation",
      html: `<p>Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.</p><ul><li>À l'attention de : <b>${ENTITY.name}</b>, ${ENTITY.address}, courrier électronique : <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la prestation de services suivante : <b>LiczMat Pro (abonnement)</b>.</li><li>Commandé le (*)</li><li>Nom du (des) consommateur(s)</li><li>Adresse du (des) consommateur(s)</li><li>Signature du (des) consommateur(s), uniquement en cas de notification du présent formulaire sur papier</li><li>Date</li></ul><p>(*) Rayez la mention inutile.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Remboursement complémentaire dans les 14 jours",
      html: `<p>En plus du droit légal de rétractation, nous remboursons l'intégralité du montant payé à tout client, y compris un professionnel, si le client se rétracte ou résilie dans les 14 jours suivant le premier achat d'un abonnement LiczMat Pro. Cette règle s'applique uniquement au premier achat par compte et ne s'applique pas aux renouvellements.</p>`
    },
    {
      id: "pflichten",
      h: "10. Obligations du client",
      html: `<ul><li>Vous fournissez des informations exactes et complètes et les maintenez à jour.</li><li>Vous gardez votre mot de passe secret et protégez l'accès à votre compte.</li><li>Vous n'introduisez aucun contenu illicite dans les devis ou les liens partagés. Toute personne connaissant le lien d'un devis ou d'un projet partagé peut en consulter le contenu.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Modifications de la prestation",
      html: `<p>Nous ne pouvons modifier la prestation que pour un motif valable, par exemple en raison de nouvelles exigences légales, pour des motifs de sécurité ou en raison d'évolutions techniques. La modification n'entraîne aucun coût supplémentaire pour vous. Nous vous en informons clairement et suffisamment à l'avance.</p><p>Si une modification entrave de manière non négligeable l'accès ou l'utilisation par un consommateur, celui-ci peut résilier le contrat sans frais dans les 30 jours suivant la réception de l'information ou la modification, la date la plus tardive étant retenue (§ 327r BGB).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Garantie légale et conformité",
      html: `<p>Les droits légaux relatifs aux défauts et à la conformité s'appliquent. Pour les consommateurs, les articles 327 et suivants du Code civil allemand (BGB) s'appliquent en particulier.</p>`
    },
    {
      id: "haftung",
      h: "13. Responsabilité",
      html: `<p>Notre responsabilité est engagée sans limitation en cas de faute intentionnelle et de négligence grave, en cas d'atteinte à la vie, au corps ou à la santé, ainsi qu'en vertu de la loi allemande sur la responsabilité du fait des produits défectueux (Produkthaftungsgesetz).</p><p>En cas de négligence légère, nous ne répondons que de la violation d'une obligation contractuelle essentielle. Les obligations contractuelles essentielles, également qualifiées d'obligations cardinales, sont des obligations dont l'exécution permet la bonne réalisation du contrat et au respect desquelles le client peut légitimement se fier. Dans ce cas, la responsabilité est limitée au préjudice prévisible et typique du contrat. Pour le reste, la responsabilité en cas de négligence légère est exclue.</p><p>La responsabilité légale en vertu des articles 327 et suivants du BGB demeure inchangée.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Modifications de prix",
      html: `<p>Le prix d'un abonnement en cours ne peut être modifié qu'avec votre accord exprès. Nous vous en informons au moins 30 jours à l'avance. Sans votre accord, l'abonnement se poursuit au tarif précédent. Chaque partie peut y mettre fin à l'issue de la période déjà payée.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Modifications des présentes conditions",
      html: `<p>Les modifications des présentes Conditions générales ne s'appliquent à un contrat en cours qu'avec votre accord exprès. Nous vous en informons au moins 30 jours à l'avance. Sans votre accord, les conditions antérieures continuent de s'appliquer. Chaque partie peut mettre fin à l'abonnement à l'issue de la période déjà payée.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Protection des données",
      html: `<p>Vous trouverez des informations relatives au traitement des données personnelles dans la <a href="/fr/politique-de-confidentialite/">Politique de confidentialité</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Règlement des litiges de consommation",
      html: `<p>Nous ne sommes ni disposés ni tenus de participer à des procédures de règlement des litiges devant un organisme de médiation de la consommation (§ 36 VSBG).</p>`
    },
    {
      id: "schluss",
      h: "18. Dispositions finales",
      html: `<p>Le droit allemand s'applique, à l'exclusion de la Convention des Nations Unies sur les contrats de vente internationale de marchandises. Pour les consommateurs, ce choix de loi ne les prive pas de la protection offerte par les dispositions impératives du droit de leur pays de résidence habituelle.</p><p>Pour les commerçants, les personnes morales de droit public et les fonds spéciaux de droit public, le tribunal compétent est celui du siège du fournisseur.</p><p>Si une stipulation du présent contrat était ou devenait invalide, les autres stipulations resteraient en vigueur.</p><p>La version allemande fait foi. Les traductions sont fournies à titre indicatif uniquement.</p>`
    }
  ]
};
