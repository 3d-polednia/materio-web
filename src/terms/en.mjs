import { ENTITY } from "../site.mjs";

export default {
  lang: "en",
  title: "Terms and Conditions for LiczMat Pro",
  updated: "2026-11-11",
  binding: false,
  translationNote: "This is a translation. The German version is binding.",
  sections: [
    {
      id: "anbieter",
      h: "1. Provider and scope",
      html: `<p>The provider of LiczMat Pro is <b>${ENTITY.name}</b>, ${ENTITY.address}, telephone: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, email: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, VAT ID: ${ENTITY.taxId}.</p><p>These Terms and Conditions apply to the paid <b>LiczMat Pro</b> subscription offered on liczmat.com for the web application at <a href="/app/">liczmat.com/app/</a>. The free calculators on liczmat.com, the Android app, and the free LiczMat account are provided free of charge and are not part of the paid contract.</p><p>A consumer within the meaning of section 13 of the German Civil Code (BGB) is any natural person who enters into a legal transaction for purposes that are predominantly outside their trade, business, or independent professional activity. An entrepreneur within the meaning of section 14 BGB is a natural or legal person or a partnership with legal capacity that, when entering into the contract, acts in the exercise of its trade, business, or independent professional activity.</p><p>The customer's own terms and conditions do not apply.</p>`
    },
    {
      id: "leistung",
      h: "2. Service",
      html: `<p>LiczMat Pro provides the Pro features online in your browser as described on the <a href="/en/liczmat-pro/">LiczMat Pro page</a> at the time of the order. These include, in particular, client management, quotes with a PDF and sharing link, scheduling, prices and costs in projects, and the storage of company details. LiczMat stores the data you enter in your account.</p><p>Calculations and quotes created from them are aids. You check quantities, prices, results, and suitability for the intended purpose before purchasing materials or submitting a quote.</p><p>Uninterrupted availability is not guaranteed. Maintenance, technical disruptions, and outages may occur. We aim to keep restrictions as short as possible.</p>`
    },
    {
      id: "test",
      h: "3. Free trial",
      html: `<p>New accounts receive LiczMat Pro <b>free of charge for 14 days</b>. No payment details are required. The trial ends automatically and does not turn into a paid subscription. When it ends, the account returns to the free plan.</p>`
    },
    {
      id: "vertrag",
      h: "4. Conclusion of the contract",
      html: `<p>The presentation of LiczMat Pro on the Website does not constitute a binding offer to enter into a contract.</p><p>To place an order, you sign in at <a href="/app/">liczmat.com/app/</a>, choose the monthly or yearly subscription, and click the purchase button. You are redirected to Stripe Checkout. There you enter your email address and payment details. You can review and correct all entries before the final click. The contract is concluded when you click the final <b>“Subscribe”</b> button, which indicates that the subscription is subject to payment.</p><p>The payment service provider is Stripe Payments Europe, Limited (Ireland). Stripe confirms the contract by email.</p><p>The contract can be concluded in any of the 13 languages offered on the Website. The German version is binding. We do not store the contract text separately. These Terms and Conditions are always available at this address and can be saved or printed. Receipts and invoices are available in the Stripe customer portal.</p>`
    },
    {
      id: "preise",
      h: "5. Prices and payment",
      html: `<p>The prices displayed on the <a href="/en/liczmat-pro/">LiczMat Pro page</a> and in the checkout at the time of the order apply. These are final prices including statutory VAT. There are no additional costs. Billing is in the currency displayed in the checkout.</p><p>The price is billed in advance for the relevant period, one month or one year, and is automatically charged at the start of each period using the payment method selected in the checkout. The payment methods offered in the checkout are available.</p>`
    },
    {
      id: "laufzeit",
      h: "6. Term and cancellation",
      html: `<h3>6.1. Monthly subscription</h3><p>The monthly subscription runs for one month. It renews for one further month at a time unless cancelled. You can cancel it at any time with effect at the end of the current contractual month.</p><h3>6.2. Yearly subscription</h3><p>The initial term is one year. You can cancel the subscription at any time with effect at the end of that year. If it is not cancelled, it continues for an indefinite period after the first year and may then be cancelled at any time with one month's notice. Billing continues yearly in advance. We refund on a pro rata basis any amount already paid for the time after the contract ends.</p><h3>6.3. How to cancel</h3><p>You can cancel in the customer portal through the <b>Account</b> section at <a href="/app/">liczmat.com/app/</a>, by using the <a href="/en/cancel-contract/">“Cancel contracts here”</a> button, by email to <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, or by letter to ${ENTITY.name}, ${ENTITY.address}. The right to terminate for good cause remains unaffected.</p><h3>6.4. After the contract ends</h3><p>After the contract ends, the account returns to the free plan. Your data remains stored in the account. Pro features are no longer available until LiczMat Pro is ordered again. Information on deleting the account is available in the <a href="/en/privacy-policy/">Privacy Policy</a>.</p>`
    },
    {
      id: "widerruf",
      h: "7. Instructions on withdrawal",
      html: `<p>The following statutory right of withdrawal applies only to consumers.</p><h3>Right of withdrawal</h3><p>You have the right to withdraw from this contract within 14 days without giving any reason.</p><p>The withdrawal period will expire after 14 days from the day of the conclusion of the contract.</p><p>To exercise the right of withdrawal, you must inform us, <b>${ENTITY.name}</b>, ${ENTITY.address}, telephone: <a href="tel:${ENTITY.phone}">${ENTITY.phone}</a>, email: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a>, of your decision to withdraw from this contract by an unequivocal statement, for example a letter sent by post or email.</p><p>You may use the model withdrawal form below or the withdrawal function on the <a href="/en/withdraw-from-contract/">“Withdraw from contract here”</a> page, but it is not obligatory. If you use this online function, we will send you an acknowledgement of receipt of the withdrawal on a durable medium, for example by email, including its content and the date and time of its submission, without undue delay.</p><p>To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.</p><h3>Effects of withdrawal</h3><p>If you withdraw from this contract, we shall reimburse to you all payments received from you without undue delay and in any event not later than 14 days from the day on which we are informed about your decision to withdraw from this contract.</p><p>We will carry out such reimbursement using the same means of payment as you used for the initial transaction, unless you have expressly agreed otherwise. In any event, you will not incur any fees as a result of such reimbursement.</p><p>We do not require any payment for the period before withdrawal.</p>`
    },
    {
      id: "formular",
      h: "8. Model withdrawal form",
      html: `<p>Complete and return this form only if you wish to withdraw from the contract.</p><ul><li>To: <b>${ENTITY.name}</b>, ${ENTITY.address}, email: <a href="mailto:${ENTITY.email}">${ENTITY.email}</a></li><li>I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service: <b>LiczMat Pro (subscription)</b>.</li><li>Ordered on (*)</li><li>Name of consumer(s)</li><li>Address of consumer(s)</li><li>Signature of consumer(s), only if this form is notified on paper</li><li>Date</li></ul><p>(*) Delete as appropriate.</p>`
    },
    {
      id: "geld-zurueck",
      h: "9. Additional refund within 14 days",
      html: `<p>In addition to the statutory right of withdrawal, we refund the full amount paid to every customer, including an entrepreneur, if the customer withdraws or cancels within 14 days after the first purchase of a LiczMat Pro subscription. This rule applies only to the first purchase per account and does not apply to renewals.</p>`
    },
    {
      id: "pflichten",
      h: "10. Customer obligations",
      html: `<ul><li>You provide accurate and complete information and keep it up to date.</li><li>You keep your password secret and protect access to your account.</li><li>You do not place unlawful content in quotes or shared links. Anyone who knows a shared quote or project link can view its content.</li></ul>`
    },
    {
      id: "aenderungen",
      h: "11. Changes to the service",
      html: `<p>We may change the service only for a valid reason, for example because of new legal requirements, security requirements, or technical development. The change does not cause any additional cost to you. We inform you clearly and sufficiently in advance.</p><p>If a change impairs a consumer's access to or use of the service more than insignificantly, the consumer may terminate the contract free of charge within 30 days after receiving the information or after the change, whichever is later (section 327r BGB).</p>`
    },
    {
      id: "gewaehrleistung",
      h: "12. Statutory rights for defects and lack of conformity",
      html: `<p>Statutory rights for defects and lack of conformity apply. In particular, sections 327 and following of the BGB apply to consumers.</p>`
    },
    {
      id: "haftung",
      h: "13. Liability",
      html: `<p>We have unlimited liability for intent and gross negligence, for injury to life, body, or health, and under the German Product Liability Act (Produkthaftungsgesetz).</p><p>In the event of slight negligence, we are liable only for a breach of an essential contractual obligation. Essential contractual obligations, also known as cardinal obligations, are obligations whose fulfilment makes proper performance of the contract possible and on whose fulfilment the customer may normally rely. In this case, liability is limited to the damage that is typical for the contract and foreseeable. Liability for slight negligence is otherwise excluded.</p><p>Statutory liability under sections 327 and following of the BGB remains unaffected.</p>`
    },
    {
      id: "preisaenderung",
      h: "14. Price changes",
      html: `<p>The price of an ongoing subscription changes only with your express consent. We inform you at least 30 days in advance. Without your consent, the subscription continues at the previous price. Either party may end it at the end of the period already paid for.</p>`
    },
    {
      id: "agb-aenderung",
      h: "15. Changes to these Terms",
      html: `<p>Changes to these Terms and Conditions apply to an ongoing contract only with your express consent. We inform you at least 30 days in advance. Without your consent, the previous Terms and Conditions continue to apply. Either party may end the subscription at the end of the period already paid for.</p>`
    },
    {
      id: "datenschutz",
      h: "16. Data protection",
      html: `<p>Information about the processing of personal data is available in the <a href="/en/privacy-policy/">Privacy Policy</a>.</p>`
    },
    {
      id: "streit",
      h: "17. Consumer dispute resolution",
      html: `<p>We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board (section 36 VSBG).</p>`
    },
    {
      id: "schluss",
      h: "18. Final provisions",
      html: `<p>German law applies, excluding the United Nations Convention on Contracts for the International Sale of Goods. For consumers, this choice of law does not remove the protection of mandatory provisions of the country of their habitual residence.</p><p>For merchants, legal persons under public law, and special funds under public law, the provider's registered office is the place of jurisdiction.</p><p>If any provision of this contract is or becomes invalid, the remaining provisions remain valid.</p><p>The German version is binding. Translations are for information only.</p>`
    }
  ]
};
