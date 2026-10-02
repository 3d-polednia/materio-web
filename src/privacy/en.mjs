import { ENTITY } from "../site.mjs";

export default {
  lang: "en",
  title: "Privacy Policy",
  updated: "2026-10-02",
  binding: false,
  translationNote: "This is a translation. The German version is binding.",
  sections: [
    {
      id: "podejscie",
      h: "1. Privacy approach",
      html: `<p>This policy describes what data the mobile application <b>LiczMat, building materials calculator</b> ("App") and the website <b>liczmat.com</b> ("Website") process, and for what purpose. The data controller is <b>${ENTITY.name}</b>, ${ENTITY.address} ("we"), contact: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p><p>LiczMat is built <b>offline-first</b>. All calculations are performed on your device and work without the internet. The local database is the single source of truth, and the cloud is merely a copy of it.</p><p><b>An account is optional.</b> You do not need to sign in to perform calculations. As long as you do not create an account, we do not send your projects or calculations to any server. A backup is a file that you export and store yourself. If you choose to create an account, the data described below will be sent to <b>Google Firebase</b>. See section 3 for details.</p><p>The App also uses other <b>Google</b> services (ads and map/store search), which process certain data. We describe this below.</p>`
    },
    {
      id: "urzadzenie",
      h: "2. Data stored on the device",
      html: `<p>Locally, on your device, we store: projects, calculations, shopping lists, rooms, custom materials, and settings (e.g. language, currency, theme, contractor details). Uninstalling the App or clearing its data permanently removes this information from the device. You create and store the backup (export to a file) yourself.</p><p><b>The material catalog, your custom materials and prices, and settings are not synchronized.</b> They remain exclusively on the device, even if you have an account.</p>`
    },
    {
      id: "konto",
      h: "3. LiczMat account and synchronization (optional)",
      html: `<p>You can create a <b>LiczMat account</b> to have the same projects on your smartphone and in your browser (<a href="/app/">liczmat.com/app/</a>). The account is free and completely voluntary. Without an account, the App and Website function as before.</p>`
    },
    {
      id: "konto-jakie",
      h: "3.1. What data we process when you have an account",
      html: `<ul><li><b>Email address and password.</b> Handled by <b>Firebase Authentication</b>. We do not see or store your password, it is stored by Google as a hash. The Google sign-in window and pages accessed via links in account emails (e.g. password reset, email confirmation) are served by <b>auth.liczmat.com</b>, a Firebase Hosting service (Google) within the same project.</li><li><b>Sign in with Google</b> (optional alternative to password). In this case, there is no password. We receive the email address, display name, and an account ID from Google to link them to your data in LiczMat (the display name is used in the welcome email). We do not retrieve any other data from your Google account.</li><li><b>Account ID (UID)</b> assigned by Firebase.</li><li><b>Account content:</b> projects, rooms, estimates, and shopping lists. Names, quantities, units, prices, currency, calculator inputs, as well as creation and modification timestamps.</li><li><b>Technical data:</b> account creation date, last used date, and whether you are connecting via the App or the Website.</li></ul>`
    },
    {
      id: "konto-gdzie",
      h: "3.2. Where the data is stored",
      html: `<p>The <b>Google Cloud Firestore</b> database and <b>Cloud Functions</b> run in the <b>europe-central2 (Warsaw)</b> region, which is within the European Union. However, the <b>Firebase Authentication</b> service (your login data, such as email address, display name, password hash, and Google account ID) runs on Google's global infrastructure, so this data may be processed in the United States (see section 8). Google acts here as a data processor on our behalf.</p>`
    },
    {
      id: "konto-kto",
      h: "3.3. Who has access to it",
      html: `<p>Only the account owner. Firestore security rules allow reading and writing account data only for the authenticated user with the same ID. The only exception is a link that you create yourself. See section 3.5.</p>`
    },
    {
      id: "konto-sync",
      h: "3.4. How synchronization works",
      html: `<p>After every local change, the App sends the document to Firestore and pulls changes from the cloud back into the device database. In case of a conflict, the newer entry wins (comparing timestamps). Deleting a record does not immediately remove it from the cloud: the document is marked as deleted so the other device learns about the deletion and does not restore it. These marks are cleared after <b>30 days</b>.</p>`
    },
    {
      id: "konto-link",
      h: "3.5. Sharing an estimate via link",
      html: `<p>If you tap "Share", we create a <b>copy</b> of the selected project (name, estimates, shopping list, currency) at a random 128-bit address liczmat.com/p/&lt;token&gt;. This copy is <b>publicly readable for anyone who knows the link</b>. The token in the address is the only protection, so only share it with people who should see the estimate. The copy does not update automatically, you must update it manually via a button. Deleting the link revokes access immediately. The person opening the link does not need an account, and we collect no data about them other than standard Website analytics (section 6).</p>`
    },
    {
      id: "konto-usun",
      h: "3.6. How long we keep data and how to delete it",
      html: `<p>We keep account data for as long as the account exists. You can delete individual projects and rooms at any time. You can delete the entire account yourself at <a href="/app/">liczmat.com/app/</a> → <b>Account</b> tab → <b>Delete account</b>. This deletes all account documents in Firestore (projects, rooms, estimates, shopping lists, and created links), and finally the account itself in Firebase Authentication. This cannot be undone. In the same tab, you can previously download all your account content as a JSON file. If you want us to do this for you, write to <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. You delete data stored on your device or in the browser separately by clearing the App data or site data.</p>`
    },
    {
      id: "konto-podstawa",
      h: "3.7. Legal basis",
      html: `<p>Processing account data is necessary for the performance of the service you request. Art. 6(1)(b) GDPR (performance of a contract). Creating an account is voluntary, without it you can use all calculator features.</p>`
    },
    {
      id: "reklamy",
      h: "4. Ads (Google AdMob)",
      html: `<p>The App is free and supported by ads provided by <b>Google AdMob</b>. Therefore, Google, as an ad provider, may collect and process:</p><ul><li><b>the advertising ID</b> (Android Advertising ID),</li><li>IP address and device data (model, operating system, language settings),</li><li>approximate location (based on IP address),</li><li>information about ad interactions (impressions, clicks).</li></ul><p>This data is used to serve ads, cap their frequency, measure performance, and prevent fraud. Google's policies describe this: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">Google's Partner Sites Policy</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>.</p>`
    },
    {
      id: "reklamy-zgoda",
      h: "4.1. Consent (GDPR) and personalized ads",
      html: `<p>If you are located in the European Economic Area, the UK, or Switzerland, we show a consent dialog (Google User Messaging Platform) on the first launch, where you decide on personalized ads. Without your consent, only <b>non-personalized</b> ads are shown. You can change or withdraw your consent at any time by clearing the app data in system settings or resetting the advertising ID in Android settings. The legal basis for personalised ads is consent, Art. 6(1)(a) GDPR, and for reading or storing information on the device additionally § 25(1) TDDDG (German law on data protection in telecommunications and digital services). Non-personalised ads: legitimate interest in financing the free app, Art. 6(1)(f) GDPR.</p>`
    },
    {
      id: "reklamy-analiza",
      h: "4.2. App analytics (Firebase / Google Analytics)",
      html: `<p>The App uses <b>Google Analytics for Firebase</b> to anonymously and in aggregate measure how its features are used (e.g. which calculators you open, the number of active users). This helps us improve LiczMat. Analytics is <b>disabled</b> by default and is only enabled after you give your consent in the same dialog (Google User Messaging Platform). Without consent, nothing is collected. The data is processed by Google in accordance with the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a>. The legal basis is consent, Art. 6(1)(a) GDPR and § 25(1) TDDDG; consent can be withdrawn at any time with effect for the future.</p>`
    },
    {
      id: "lokalizacja",
      h: "5. Location and store search (Google Maps / Places)",
      html: `<p>The "Find store" feature uses <b>Google Maps</b> and <b>Google Places</b>. If you grant location permission, the App uses your approximate or precise location to show nearby hardware stores and route you there. Requests to map services are processed by Google according to their privacy policy. You can deny location access. In that case, stores will not be found automatically, but all other features will work normally. We do not store your location, neither on the device nor in the account.</p>`
    },
    {
      id: "strona",
      h: "6. Website",
      html: `<p>The website <b>liczmat.com</b> is static. When the site is opened, the host GitHub Pages (GitHub, Inc.) processes standard server log data (IP address, time, requested page, browser) to deliver the site securely; legal basis Art. 6(1)(f) GDPR (legitimate interest in a secure and reliable website). It uses <b>Google Analytics</b> (GA4) to anonymously and in aggregate measure traffic (e.g. how many people visit the Website and how many click through to Google Play), so we can improve it. Analytics is disabled by default: in accordance with the GDPR, we first ask for your consent, and Google Analytics (including setting cookies) only starts after you grant it. You can decline, and all other features will remain usable. The legal basis is consent, Art. 6(1)(a) GDPR and § 25(1) TDDDG; withdrawal at any time via the cookie/consent setting on the site, with effect for the future. Apart from Analytics, the Website does not use web fonts. All other code and styles are served from the Website's domain, and interactive calculators compute exclusively in your browser.</p><p>The exceptions are areas where external services are integrated. <b>Stores:</b> The Website embeds a <b>Google Maps</b> map, which is loaded from Google's servers. If you share your location, it is only used to center the map and is not stored anywhere. To show the list of nearest stores, the Website sends your approximate coordinates to the <b>OpenStreetMap (Overpass API)</b> service and retrieves public store data. The "Navigate" button opens the route in Google Maps. City suggestions based on postal codes use a GeoNames (geonames.org) database, CC BY 4.0, hosted directly on our server, and no third party receives the entered postal code. The legal basis is Art. 6(1)(a) GDPR when the visitor shares the location, otherwise the map loads only when the visitor opens the store finder. <b>/app/:</b> After logging in, the Website connects to <b>Firebase</b> (Authentication and Firestore) under the terms in section 3 and stores login data in the browser so you are not asked for a password on every visit. <b>/p/&lt;token&gt;:</b> The Website fetches the shared copy of an estimate from Firestore without logging in and without collecting data about the person opening the link. Both these subpages are excluded from indexing.</p><p><b>Projects, rooms, and estimates saved on the Website without logging in</b> remain exclusively in your browser's local storage (localStorage) and are not sent anywhere. We do not see them and have no access to them. You delete them by clearing site data in your browser. They only go to the cloud when you log into your account and manually click "Send from browser to account". From that moment, section 3 applies. We also store your language choice, currency choice, theme choice, and your decision regarding analytics consent in the browser.</p>`
    },
    {
      id: "komu",
      h: "7. Who we share data with",
      html: `<p>We do not sell data and do not create user profiles. The data described above is processed by <b>Google</b> as a data processor: AdMob (ads), Maps and Places (maps and stores), Analytics (statistics), and, if you create an account, Firebase Authentication, Cloud Firestore, and Firebase Hosting (account and synchronization). In addition, after account creation, we send a one-time welcome email to your email address in the language of the page on which the account was created. This email is processed and sent via the servers of <b>OVH SAS</b> (France, EU), our email provider, acting as a data processor on our behalf, based on Art. 6(1)(b) GDPR. Otherwise, we only share data with the people you yourself give the estimate link to (section 3.5), and when required by applicable law.</p>`
    },
    {
      id: "komu-stripe",
      h: "7.1. Payments (Stripe)",
      html: `<p>The <b>LiczMat Pro</b> subscription is handled by <b>Stripe</b> (Stripe Payments Europe, Ltd., Ireland). If you decide to purchase it, you will be redirected to the Stripe payment page. Stripe, as an independent data controller, receives and processes payment data: card number, billing details, and payment history. <b>We do not see or store your card number.</b> Your email address and account ID (UID) are sent to Stripe so that the paid subscription can be assigned to the correct account. In return, we only receive the plan status (Free or Pro), its expiration date, and whether the subscription will renew. You manage invoices, card changes, and cancellations in the Stripe customer portal. Stripe's privacy policy is available at: <a href="https://stripe.com/privacy" rel="noopener" target="_blank">stripe.com/privacy</a>.</p>`
    },
    {
      id: "poza-eog",
      h: "8. Data transfers outside the EEA",
      html: `<p>Google LLC (responsible for Firebase Authentication, Google Analytics, AdMob, Maps, Places, and Firebase Hosting) and GitHub, Inc. (which hosts our website and processes standard server logs, including IP addresses) are US companies. The transfer of your data to the US is based on the <b>adequacy decision of the European Commission for the EU-US Data Privacy Framework</b>, as both companies are certified. Additionally, it is based on the <b>standard contractual clauses</b> included in their data processing terms (Google Cloud Data Processing Addendum, GitHub Data Protection Agreement).</p>`
    },
    {
      id: "prawa",
      h: "9. Your rights (GDPR)",
      html: `<p>Under the GDPR, you have the right to access, rectify, erase, restrict processing, data portability, and object, as well as the right to withdraw your consent to personalized ads and analytics. <b>Where processing is based on Art. 6(1)(f) GDPR, you may object at any time on grounds relating to your particular situation (Art. 21 GDPR).</b></p><p>You directly control data that remains on the device (app data, permissions, advertising ID in Android settings). You can review and change account data in the App or at <a href="/app/">liczmat.com/app/</a>, export it via the backup feature, and delete it by removing individual records or requesting the deletion of the entire account (section 3.6). For questions regarding your data, write to: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>. You also have the right to lodge a complaint with the competent supervisory authority: <b>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</b>, Promenade 18, 91522 Ansbach, <a href="https://www.lda.bayern.de" target="_blank" rel="noopener">www.lda.bayern.de</a>, or with the data protection supervisory authority in your country of residence within the EU.</p>`
    },
    {
      id: "dzieci",
      h: "10. Children",
      html: `<p>The App is not directed at children, and we do not knowingly collect data from persons under 13 years of age. A LiczMat account is intended for persons who are 16 years of age or older, or have the consent of their legal guardians.</p>`
    },
    {
      id: "zmiany",
      h: "11. Changes and contact",
      html: `<p>We may update this policy. We will announce significant changes in the App or on Google Play. The date of the last update is at the top of the document. Contact: <b>${ENTITY.name}</b>, email: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>.</p>`
    }
  ]
};
