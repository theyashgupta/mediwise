# Rules that apply to MediWise abroad

Research date: 2026-10-15. This is research, not legal advice. Items marked unverified come from background knowledge, not from a primary source read in this pass.

## Summary

- No device licence and no SOC 2 report is a legal prerequisite for MediWise as it works today. The obligations that bind are privacy law, consumer law and tax.
- Device status follows intended purpose and wording, not technology. An app that shows each value against the printed reference range, explains it and tracks it can stay outside device scope in most markets. Diagnosis-like output, "you probably have X", risk scores and chat answers that steer treatment push it inside. The chat is the highest-risk feature.
- Health data is the heavy part: GDPR Article 9 (EU, UK), the Washington My Health My Data Act and the FTC Health Breach Notification Rule (US), DPDP Act 2023 and Rules 2025 (India). The UAE and Saudi Arabia have localisation rules that may force a local region.
- SOC 2 is an AICPA attestation, not a licence. Consumers do not ask for it. B2B buyers do. A published security page with concrete controls is the usual path for a direct-to-consumer app.

## 1. Medical device status

- US FDA: the clinical decision support carve-out (Cures Act 520(o)(1)(E), guidance revised 6 January 2026) covers software that supports a healthcare professional only. Patient-facing tools are not covered. The general wellness policy covers healthy-lifestyle software unrelated to disease. Software that only displays and organises lab values with the lab's ranges sits in the former "medical device data system" category, which FDA does not enforce against (unverified for the 2026 text). Software that gives a diagnosis or treatment recommendation is a device (likely Class II, De Novo or 510(k)).
- EU MDR 2017/745: Rule 11 makes software that provides information for diagnostic or therapeutic decisions Class IIa. MDCG 2019-11 Rev.1 (June 2025) decides what counts as medical device software by intended purpose and the manufacturer's own claims. Class IIa needs a notified body, ISO 13485, IEC 62304, clinical evaluation, an EU authorised representative and EUDAMED registration (12 to 24 months, six figures, unverified).
- UK MHRA: UK MDR 2002 applies. The medical purpose comes from labelling and promotional material, including app store text and landing pages. A "for information only" line does not help when a claim elsewhere says the app diagnoses.
- Australia TGA: since 25 February 2021 general health and wellness software, consumer health, digitisation and enabling technology are excluded. Every feature of a multi-function app must meet the exclusion. No lab-result display carve-out was confirmed.
- India CDSCO: medical device software guidance (draft 21 October 2025, final reported later) maps software as a medical device to Classes A to D under the Medical Devices Rules 2017 and excludes general wellness software. Primary text not read.
- Singapore HSA: classification by intended medical purpose, classes A to C. No text on lab-result explainers found.
- Canada, UAE, Saudi: not researched.

What keeps MediWise out of scope everywhere:
- Say "explains", "shows each value against the printed reference range", "tracks". Never "diagnose", "detect", "monitor a disease", "abnormal", "risk score", or a named condition as the user's result.
- Keep "Ask your doctor" beside every flagged value and every suggestion.
- The chat refuses diagnosis, dosages, drug names and treatment advice and sends the user to a doctor. Log refusals.
- State in the terms, the landing page and onboarding: MediWise gives information, does not diagnose, treat or monitor disease, and is not a medical device.

## 2. Health data privacy by market

### India, DPDP Act 2023 and Rules 2025
- Rules notified 13 or 14 November 2025 (sources differ). Staged rollout: consent manager rules after about 12 months, main obligations after about 18 months (around May 2027).
- Breach notice to the Data Protection Board within 72 hours.
- Under-18s need verifiable parental consent (Rule 10). An 18+ age gate avoids this.
- Section 16: transfers abroad are allowed except to countries the Government restricts by notification.
- Penalties up to INR 250 crore (secondary source).

### United States
- HIPAA does not bind a direct-to-consumer app. It binds covered entities and their business associates.
- FTC Health Breach Notification Rule, amended 29 July 2024: covers health apps outside HIPAA. Unauthorised disclosure, including a tracking pixel on a health page, is a breach. Civil penalty about USD 51,744 per violation.
- Washington My Health My Data Act (effective 31 March 2024, 30 June 2024 for small businesses): a separate Consumer Health Data Privacy Policy linked from the homepage, opt-in consent to collect beyond what the requested service needs, signed authorisation to sell, a private right of action, extraterritorial reach to anyone targeting Washington consumers.
- California CPRA treats health data as sensitive personal information. Nevada and Connecticut have consumer health data laws (unverified).

### EU and UK
- GDPR Article 9: health data needs explicit consent (9(2)(a)) plus an Article 6 basis. Large-scale health data needs a DPIA.
- Article 27: a controller outside the EU that serves EU residents appoints an EU representative. The UK needs a UK representative.
- India has no adequacy decision. Transfers from EU users to India use the 2021 Standard Contractual Clauses plus a transfer impact assessment. The UK uses the IDTA or the UK Addendum. Sub-processors (Anthropic in the US, Render in Singapore) need their own mechanism.
- Cookies: opt-in consent for non-essential cookies. MediWise has no analytics today, keep it that way on authenticated pages.
- Digital content: get express consent to immediate performance at checkout and an acknowledgement that the 14-day withdrawal right is lost.
- European Accessibility Act applies from 28 June 2025: WCAG 2.1 AA.

### Australia, Canada
- Privacy Act 1988: health information is sensitive information, APP 8 governs cross-border disclosure. PIPEDA and Quebec Law 25 in Canada. Not researched in depth.

### Gulf
- UAE ICT Health Law (Federal Law 2 of 2019) Article 13: health data relating to UAE health services may not be stored or processed outside the UAE by default. Whether a consumer app holding a user's own report is in scope is not settled. Treat the UAE and Saudi Arabia as blocked until counsel confirms.

## 3. Security certifications

- SOC 2: an attestation by a CPA firm against the AICPA Trust Services Criteria. Type I tests design at a point in time, Type II tests operation over 3 to 12 months.
- Cost for a small startup (third-party estimates): platform USD 4,000 to 12,000 per year (Sprinto, Drata, Vanta), auditor USD 15,000 to 50,000, all-in first year USD 30,000 to 97,000. Type I in 6 to 12 weeks, Type II adds the window.
- ISO 27001 carries more weight in the EU, UK, Gulf and Asia. Cyber Essentials is a cheap UK baseline.
- Recommendation: not now. Publish a security page with the controls below. Revisit when a B2B buyer asks.
- What SOC 2 asks for technically: encryption in transit and at rest, access control with MFA and least privilege, audit logging, vendor management, incident response, tested backups, written policies.

## 4. Encryption

- Supabase encrypts projects at rest by default and states this is likely sufficient for SOC 2 and HIPAA needs. TLS in transit. The exact cipher is not named in the docs read.
- pgsodium and transparent column encryption are pending deprecation at Supabase. Do not build on them. Supabase Vault stays.
- Default encryption at rest does not protect against a leaked service-role key, a SQL injection read, a backup leak or provider staff access. App-level field encryption does.
- End-to-end encryption is incompatible with server-side extraction, because the server must send the document to Claude.
- Pattern for a one-person startup: envelope encryption in the app layer. One data key per user, wrapped by a master key held outside the database (an environment secret with a key id for rotation, or a KMS). Store ciphertext in Postgres. Decrypt in memory only for the Claude call and for rendering. Leave marker values in plaintext because trends and scoring query them. Encrypt free text and identity fields: profile name and date of birth, report note, narrative, translations, findings body, assistant question and answer.
- No regulator mandates field-level encryption. GDPR Article 32 asks for appropriate measures and names encryption as an example. DPDP asks for reasonable security safeguards. HIPAA treats encryption as addressable.

## 5. Anthropic as a sub-processor

- API data is not used for training. Default retention is set by the commercial retention policy (sources differ between 7 and 30 days). Zero data retention is approval-based per organisation and excludes safety classifier results. HIPAA-ready access with a BAA exists, only relevant if MediWise becomes a business associate.
- Sending health data to a US model is allowed under GDPR with explicit consent, a data processing agreement and a transfer mechanism, and under DPDP unless the Government restricts the destination. The UAE may bar it.
- Disclose: Anthropic by name, what is sent (report content), where (US), retention and no-training terms, no human reads reports. Strip name, date of birth, phone, address and ID numbers from the text before the call where feasible.

## 6. Other rules

- Advertising: FTC Act section 5, ASCI (India), UK ASA and CAP, EU unfair commercial practices, TGA advertising code. "Detect" and "diagnose" in ads create device status and misleading-claims exposure.
- Consumer law: India E-Commerce Rules 2020 require a grievance officer with published contact details. UK Consumer Rights Act. EU 14-day withdrawal for digital content.
- Tax: export of services from India is zero-rated under IGST section 16 with a yearly Letter of Undertaking. OIDAR treatment for foreign consumers is unresolved, ask a chartered accountant. EU VAT OSS, UK VAT, US state sales tax and Australian GST on digital services trigger from the first sale or at thresholds. A merchant of record (Paddle, Lemon Squeezy) removes most of this.
- Age: COPPA under 13, GDPR 13 to 16 by member state, DPDP under 18. An 18+ gate at sign-up is the simplest rule.

## 7. Action list

Before any foreign user:
1. Intended-purpose statement in terms, landing page and onboarding: information, not diagnosis, not a medical device.
2. Product wording: "outside the reference range", never "abnormal" or a named condition. "Ask your doctor" beside every flagged value.
3. Chat guardrails that refuse diagnosis, dosage, drug names and treatment, with refusals logged.
4. 18+ age gate at sign-up.
5. Explicit, separate consent for health data at sign-up, naming Anthropic (US), Render (Singapore) and Supabase (Mumbai). Store the consent with timestamp and policy version.
6. Privacy policy with a sub-processor list, retention periods, rights, breach process, international transfers, grievance officer, cookies, children.
7. Account deletion that removes every row and file, and an export that includes the original files.
8. Breach runbook with the 72-hour clocks (DPDP, GDPR) and FTC notice duties.
9. Tax decision: direct sales with a Letter of Undertaking, or a merchant of record.

EU and UK:
1. EU representative (Article 27) and UK representative, named in the policy.
2. DPIA document covering health data, LLM processing and transfers.
3. SCCs 2021 plus transfer impact assessment for India. UK Addendum or IDTA.
4. Data processing agreements with Anthropic, Supabase, Render, Cloudflare, Cashfree.
5. Cookie consent only if a non-essential cookie is ever added.
6. Digital-content withdrawal consent at checkout.
7. WCAG 2.1 AA pass.
8. An EU or UK Supabase region is optional. Decide by volume.

US:
1. Washington consumer health data privacy policy linked from the homepage, opt-in consent, rights-request process.
2. No trackers on authenticated pages (FTC rule).
3. California sensitive-data notice and "do not sell or share" handling.

Later:
- Gulf: UAE counsel before launch. A UAE region if the health data law applies.
- SOC 2 or ISO 27001 when a B2B buyer asks. Start with the security page.
- Zero data retention request to Anthropic.
- Device regulatory review before any risk score, "possible condition" output or clinician-facing feature.

## Sources

- FDA CDS guidance (revised 6 January 2026): fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- FDA general wellness policy: fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices
- MDCG 2019-11 Rev.1 (June 2025), EU MDR Rule 11.
- MHRA Software and AI as a Medical Device change programme: gov.uk/government/publications/software-and-ai-as-a-medical-device-change-programme
- TGA general health or wellness software exclusion: tga.gov.au/resources/guidance/understanding-general-health-or-wellness-software-exclusion
- CDSCO medical device software guidance (2025/2026).
- DPDP Rules 2025 (MeitY notification, November 2025), Rules 10, 12, 15.
- FTC Health Breach Notification Rule final rule (effective 29 July 2024).
- Washington My Health My Data Act, RCW 19.373.
- GDPR Articles 6, 9, 27, 32, 35, 44 to 49. SCCs Decision 2021/914.
- UAE Federal Law 2 of 2019 Article 13, Ministerial Resolution 51/2021.
- Anthropic API and data retention: platform.claude.com/docs/en/manage-claude/api-and-data-retention
- Supabase column encryption and pgsodium docs: supabase.com/docs/guides/database/column-encryption
- IGST Act section 16, export of services and the Letter of Undertaking.
