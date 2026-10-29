/**
 * Starter terms, policies and agreements for each brand. They are created
 * once (editable afterwards in Documents & Agreements) and are a starting
 * point only — have them reviewed before relying on them legally.
 *
 * Placeholders filled in when a document is sent:
 *   {{customerName}} {{customerEmail}} {{customerPhone}} {{date}}
 *   {{brandName}} {{brandAddress}} {{brandEmail}} {{brandPhone}} {{brandWebsite}}
 *   {{reference}} {{service}} {{amount}} {{staffName}}
 */

interface Tpl { code: string; title: string; category: string; requiresSignature: boolean; isPublic?: boolean; body: string }

const sig = `
<h3>Acceptance</h3>
<p>By signing below, I, <strong>{{customerName}}</strong>, confirm that I have read, understood and agree to the terms above.</p>`;

export const DEFAULT_TEMPLATES: Tpl[] = [
  // ── VisaMax ────────────────────────────────────────────────────────────
  {
    code: 'VM', title: 'VisaMax — Client Service Agreement', category: 'Agreement', requiresSignature: true,
    body: `<h2>Client Service Agreement</h2>
<p>This agreement is made on <strong>{{date}}</strong> between <strong>{{brandName}}</strong> ({{brandAddress}}) and <strong>{{customerName}}</strong> ("the Client") for: <strong>{{service}}</strong> (Ref: {{reference}}).</p>
<h3>1. Our services</h3><p>We will advise the Client on requirements, prepare and review application documents, book appointments, and submit applications or bookings on the Client's behalf as agreed.</p>
<h3>2. Client responsibilities</h3><ul><li>Provide complete, true and genuine information and documents.</li><li>Attend appointments, biometrics and interviews as scheduled.</li><li>Pay agreed fees on time.</li></ul>
<h3>3. No guarantee of approval</h3><p>Visa, admission and immigration decisions are made solely by embassies, consulates, schools and authorities. {{brandName}} cannot guarantee approval of any application.</p>
<h3>4. Fees</h3><p>Agreed service fee: <strong>{{amount}}</strong>. Embassy/visa, VFS/TLS, airline, hotel and third-party fees are separate unless stated, and are paid to those parties.</p>
<h3>5. Refunds</h3><p>Service fees are refundable only as described in our Refund Policy. Third-party fees already paid are non-refundable.</p>
<h3>6. False documents</h3><p>We will not submit forged or misleading documents. If the Client provides such documents, we may terminate this agreement without refund.</p>
<h3>7. Data protection</h3><p>Personal data is used only to deliver the service and is handled in line with the Nigeria Data Protection Act 2023.</p>${sig}`,
  },
  {
    code: 'VM', title: 'VisaMax — Refund Policy', category: 'Refund Policy', requiresSignature: false, isPublic: true,
    body: `<h2>Refund Policy</h2>
<ul><li>Consultation fees are non-refundable once the consultation has taken place.</li>
<li>Service fees can be refunded at 70% if the Client cancels before any document preparation or submission begins.</li>
<li>No refund is due once an application has been submitted, regardless of the decision.</li>
<li>Embassy, VFS/TLS, airline, insurance and hotel charges follow the third party's own policy.</li>
<li>Refund requests must be made in writing to {{brandEmail}} and are processed within 14 working days.</li></ul>`,
  },
  {
    code: 'VM', title: 'VisaMax — Document Authenticity & Consent Form', category: 'Consent Form', requiresSignature: true,
    body: `<h2>Document Authenticity & Data Consent</h2>
<p>I, <strong>{{customerName}}</strong>, declare that every document and piece of information I have provided to {{brandName}} for {{service}} is genuine and accurate.</p>
<p>I consent to {{brandName}} storing my personal data and sharing it with embassies, visa application centres, airlines, hotels, schools and insurers strictly to process my request.</p>${sig}`,
  },
  // ── Kurios SAT — ICT Solutions ─────────────────────────────────────────
  {
    code: 'KS-ICT', title: 'Kurios SAT — Software Development Agreement', category: 'Contract', requiresSignature: true,
    body: `<h2>Software Development Agreement</h2>
<p>Date: <strong>{{date}}</strong>. Between <strong>{{brandName}}</strong> and <strong>{{customerName}}</strong> for: <strong>{{service}}</strong> (Ref: {{reference}}).</p>
<h3>1. Scope</h3><p>The deliverables, features and timeline are those in the approved proposal/quote. Changes outside scope are quoted separately.</p>
<h3>2. Payment</h3><p>Contract value: <strong>{{amount}}</strong>. Unless agreed otherwise: 50% on signing, 30% at staging/demo, 20% before go-live.</p>
<h3>3. Client inputs</h3><p>The Client provides content, branding, accounts and feedback promptly. Delays in inputs extend the timeline.</p>
<h3>4. Ownership</h3><p>On full payment, the Client owns the delivered source code and assets created for this project. Third-party libraries remain under their own licences.</p>
<h3>5. Warranty & support</h3><p>We fix defects reported within 30 days of go-live at no cost. Ongoing maintenance, hosting and new features are under a separate support plan.</p>
<h3>6. Confidentiality</h3><p>Both parties keep each other's confidential information private.</p>${sig}`,
  },
  {
    code: 'KS-ICT', title: 'Kurios SAT — Hosting & Maintenance Terms', category: 'Terms & Conditions', requiresSignature: true,
    body: `<h2>Hosting, Domain & Maintenance Terms</h2>
<ul><li>Services renew per the billing cycle; reminders are sent 30, 7 and 1 day before renewal.</li>
<li>Unpaid services may be suspended 7 days after the renewal date and deleted after 30 days.</li>
<li>Domains are registered in the Client's name where the registry allows.</li>
<li>Backups are taken regularly but the Client should keep their own copies of critical data.</li>
<li>Support requests are handled via ticket, WhatsApp or email within business hours.</li></ul>${sig}`,
  },
  // ── Kurios SAT — Training ──────────────────────────────────────────────
  {
    code: 'KS-TRN', title: 'Kurios SAT Training Center — Student Terms & Conditions', category: 'Terms & Conditions', requiresSignature: true,
    body: `<h2>Student Terms & Conditions</h2>
<p>Student: <strong>{{customerName}}</strong> — Programme: <strong>{{service}}</strong> — Date: {{date}}</p>
<ul><li>Tuition: <strong>{{amount}}</strong>, payable before the start date or by the agreed installments.</li>
<li>Minimum 75% attendance and completion of projects/exams are required for certification.</li>
<li>Tuition is non-refundable after the first week of classes; it may be transferred to a later cohort once.</li>
<li>Students must use lab equipment responsibly and respect staff and fellow students.</li>
<li>Course materials are for personal learning only and may not be redistributed.</li></ul>${sig}`,
  },
  // ── BeadMax ────────────────────────────────────────────────────────────
  {
    code: 'BM-DSN', title: 'BeadMax Design — Custom Order Terms', category: 'Terms & Conditions', requiresSignature: true,
    body: `<h2>Custom Order Terms</h2>
<p>Customer: <strong>{{customerName}}</strong> — Order: <strong>{{service}}</strong> (Ref: {{reference}}) — Date: {{date}}</p>
<ul><li>A 60% deposit confirms the order; the balance is paid before delivery or pickup.</li>
<li>Handmade items may vary slightly in colour and bead size from samples or photos.</li>
<li>Design changes after production starts may attract extra cost and time.</li>
<li>Deposits are non-refundable once materials have been purchased.</li>
<li>Uncollected orders are held for 30 days after the customer is notified.</li></ul>${sig}`,
  },
  {
    code: 'BM-DSN', title: 'BeadMax Design — Returns & Exchange Policy', category: 'Policy', requiresSignature: false, isPublic: true,
    body: `<h2>Returns & Exchange Policy</h2>
<ul><li>Ready-made items can be exchanged within 7 days if unused and in original packaging.</li>
<li>Custom/bespoke items cannot be returned unless they differ from the approved design.</li>
<li>Damaged-on-delivery claims must be reported with photos within 48 hours.</li></ul>`,
  },
  {
    code: 'BM-VOC', title: 'Beadmax Design Vocational School — Enrolment Agreement', category: 'Agreement', requiresSignature: true,
    body: `<h2>Enrolment Agreement</h2>
<p>Student: <strong>{{customerName}}</strong> — Course: <strong>{{service}}</strong> — Date: {{date}}</p>
<ul><li>Course fee: <strong>{{amount}}</strong>. Starter kits are listed separately unless included.</li>
<li>Fees are non-refundable after the second class but may be moved to a later class once.</li>
<li>Certificates are issued after completing all practical projects.</li>
<li>Photos of student work may be used on BeadMax social media unless the student opts out in writing.</li></ul>${sig}`,
  },
  // ── Maxfood Farm ───────────────────────────────────────────────────────
  {
    code: 'MF', title: 'Maxfood Farm — Export Order Terms', category: 'Terms & Conditions', requiresSignature: true,
    body: `<h2>Export Order Terms</h2>
<p>Customer: <strong>{{customerName}}</strong> — Order: {{reference}} — Date: {{date}} — Total: <strong>{{amount}}</strong></p>
<ul><li>Orders are processed after full payment (or the agreed deposit) is confirmed.</li>
<li>All products are packed for export and shipped with the required documents (e.g. phytosanitary certificate, certificate of origin, commercial invoice).</li>
<li>Delivery times are estimates; customs inspections in Nigeria or the destination country can cause delays outside our control.</li>
<li>The customer is responsible for confirming that the products are allowed into the destination country and for any import duties and taxes.</li>
<li>Claims for missing or damaged items must be reported with photos within 48 hours of delivery.</li>
<li>Perishable items are non-returnable.</li></ul>${sig}`,
  },
  {
    code: 'MF', title: 'Maxfood Farm — Shipping & Delivery Policy', category: 'Policy', requiresSignature: false, isPublic: true,
    body: `<h2>Shipping & Delivery Policy</h2>
<ul><li>Air cargo: typically 5–10 working days. Sea freight: typically 4–8 weeks. Courier: 3–7 working days.</li>
<li>Tracking numbers are shared once shipped.</li>
<li>Shipping fees are calculated on actual or volumetric weight, whichever is higher.</li></ul>`,
  },
];
