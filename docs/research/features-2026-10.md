# Feature research, October 2026 (MEDI-43)

Goal: rank the features that make MediWise more useful to a family that uploads reports. The top five are ticket drafts in `docs/tickets/drafts/`.

Research on 2026-10-13. Every claim about another product carries the URL it came from. "Unverified" means the claim came from a search snippet or a page that did not load. Read those as leads, not facts.

## Summary

| Rank | Feature | Score | Effort | Claude cost per use | Draft |
| - | - | - | - | - | - |
| 1 | Family overview on Home | 14.7 | M | none | [family-overview](../tickets/drafts/family-overview.md) |
| 2 | Share a report from WhatsApp into MediWise | 14.0 | M | none (a normal read) | [share-into-upload](../tickets/drafts/share-into-upload.md) |
| 3 | "Since last visit" on the doctor export | 13.0 | S | none | [export-since-last-visit](../tickets/drafts/export-since-last-visit.md) |
| 4 | Retest due dates with a calendar file | 12.7 | M | none | [retest-due-dates](../tickets/drafts/retest-due-dates.md) |
| 5 | Photo checks at upload | 11.0 | S | none | [photo-checks-at-upload](../tickets/drafts/photo-checks-at-upload.md) |
| 6 | Share-with-doctor link with expiry | 8.0 | M | none | |
| 7 | Year in review per profile | 8.0 | M | about 0.1 cent per profile per year | |
| 8 | Lab change note on trends | 7.0 | S | none | |
| 9 | Hindi copy | 5.6 | L | about 0.2 to 0.3 cent per report (estimate) | |
| 10 | Medication and supplement log against markers | 5.2 | L | none | |

Below the top 10: CSV download of all values (5.0), symptom notes per visit (4.0), WhatsApp Business delivery (3.6), export to Apple Health or Health Connect (0.8).

The pattern: the features that win make the next upload easier or more likely, and they make the account useful for more than one person. Most of them need no Claude call, because the engine and the stored reports already hold the data.

## What MediWise has today

Read from `docs/PRODUCT.md`, `docs/DECISIONS.md`, `docs/DESIGN.md`, the screenshots in `docs/design/pages` and the code on 2026-10-13.

- **Upload.** Up to 20 PDFs or photos per report, 25 MB each, 100 MB in total ([after-upload-light.jpg](../design/pages/after-upload-light.jpg)). One upload uses one report credit. A failed read refunds the credit (`apps/api/src/modules/credits`).
- **Report page.** Score and tier, verdict, findings, studies, move first, "What your report says", marker groups, follow-ups and unmeasured tabs ([after-report-studies-light.jpg](../design/pages/after-report-studies-light.jpg)).
- **Dashboard.** One active profile: latest report, score change since the last visit, needs attention, recent visits ([after-dashboard-light.jpg](../design/pages/after-dashboard-light.jpg)). The dashboard screenshot shows two reports with "Could not read".
- **Family.** Profiles with relation, date of birth, sex and ancestry. A profile switcher in the sidebar. No view across profiles.
- **Trends and compare.** Trends per marker across reports, compare of two reports.
- **Doctor export.** `/reports/$reportId/export`, one report, behind sign-in. It shows move first, patterns, questions for the doctor, every marker with lab range and calibrated range ([after-export-light.jpg](../design/pages/after-export-light.jpg)). It does not show earlier values.
- **Follow-ups.** The engine writes a retest follow-up only for a marker at risk, and the text is always "Retest in 8 to 12 weeks" (`packages/engine/src/follow-ups.ts`). No due date and no reminder.
- **Units and ranges.** The engine folds unit spellings, converts units and scores every value against a calibrated range (`packages/engine/src/normalise.ts`, `catalog/schema.ts`). Lab-to-lab normalisation is mostly built.
- **Delivery.** Web only. Supabase sends the auth emails. No transactional email, no push, no WhatsApp. `site.webmanifest` exists, no service worker.
- **Money.** Credit packs: 1 for Rs 49, 5 for Rs 199, 20 for Rs 599 (`apps/api/src/modules/payments/payments.config.ts`). A Rs 499 monthly plan is an option the maintainer named on 2026-10-13. A credit costs Rs 29.95 to Rs 49.
- **Claude prices in code.** Haiku 5.5 at $0.10 per million input tokens and $0.50 per million output tokens. Sonnet 5.5 at $2 and $10 (`apps/api/src/modules/spend/claude-cost.ts`). The narrative costs about 0.1 cent per report and the findings about 0.06 cent (DECISIONS.md).
- **Out of v1 in PRODUCT.md:** medications, vitals, reminders, chat, story recap, iOS app. A draft that builds one of them changes PRODUCT.md first.

## What the field does

### Global products

| Product | Explanation | Trends | Family | Doctor handoff | Retest | Channels | Price |
| - | - | - | - | - | - | - | - |
| Function Health | Clinician notes and a plan | Yes | No, gift only | PDF download | Two tests a year, text reminders | App, web, email, text, phone | $365 a year |
| Superpower | AI, 17 scores, a plan | Claimed | No, gift only | Staff help to share | Baseline plus one retest | Text, web, app | $349 a year |
| InsideTracker | Scores and action plan | Yes | No | Help article only | Guidance only | Web, app, email | $489 first year, $149 a year after |
| Everlywell 360 | Care plan, WellScore | Not described | Unverified | Unverified | No schedule | Email, app | $399 a year |
| Apple Health records | Lab results from providers | Unverified | Unverified | Unverified | No | iPhone only | Free |

Sources:

- Function Health: clinician review, summary and action items, results over time, and upload of outside results ([functionhealth.com](https://www.functionhealth.com/), [FAQ](https://www.functionhealth.com/faq)). No family account, only a gift to an adult who makes an own account ([FAQ](https://www.functionhealth.com/faq)). PDF download to share with a doctor ([FAQ](https://www.functionhealth.com/faq)). An annual test and a mid-year test 3 to 6 months later, text reminders before a lab visit ([FAQ](https://www.functionhealth.com/faq)). $365 a year ([pricing](https://www.functionhealth.com/pricing)). The pricing page showed a promotion that ended 2026-10-08, so the regular price is unverified.
- Superpower: AI, a care team, 17 scores, a plan ([superpower.com](https://www.superpower.com/)). Staff help to share results with an outside doctor, no link or expiry ([FAQ](https://superpower.com/faqs)). Two draws a year ([FAQ](https://superpower.com/faqs)). $349 a year on the home page, $365 and a $299 code on [another page](https://superpower.com/blood-test), so the price is not consistent. Upload of outside bloodwork ([superpower.com](https://www.superpower.com/)).
- InsideTracker: members upload a PDF or JPEG, or type values, up to 30 sets a year. Analysis takes 3 to 5 business days. Markers it does not test are not shown ([platform](https://store.insidetracker.com/products/insidetracker-platform)). Retest guidance, no reminder ([help centre](https://support.insidetracker.com/en-US/articles/preparing-testing-+-using-insidetracker-84900)). Sharing with a doctor is a help article ([help](https://support.insidetracker.com/en-US/can-i-share-my-results-with-my-doctor-or-nutritionist-288898)). Ultimate plus membership $489, retest $340, platform $149 a year ([store](https://store.insidetracker.com/)).
- Everlywell 360: care plan, WellScore, 83 markers, $399 a year, repeat testing "in the very near future" ([help](https://support.everlywell.com/article/1870-everlywell-360-membership)). Everlywell+ $39 a month ([membership](https://www.everlywell.com/monthly-at-home-lab-testing-membership/)).
- Apple Health records: clinical records are read-only to apps. "You can't create or save new HKClinicalRecord objects" ([HealthKit, accessing health records](https://developer.apple.com/documentation/healthkit/accessing-health-records)). HealthKit is a native iPhone framework with no web API ([setting up HealthKit](https://developer.apple.com/documentation/healthkit/setting-up-healthkit)). Availability outside the US, UK and Canada is unverified.
- Google Health Connect: a third-party app can write lab results as FHIR `Observation` with the `laboratory` category ([write data](https://developer.android.com/health-and-fitness/guides/medical-records/write-data), [data format](https://developer.android.com/health-and-fitness/health-connect/medical-records/data-format)). It is Android only and on-device ([availability](https://developer.android.com/health-and-fitness/health-connect/availability)). The medical records API was experimental at launch ([medical records](https://developer.android.com/health-and-fitness/health-connect/medical-records)). It holds records for one person only.

What this tells us: the US products sell the blood draw. Their retest schedule is the membership. None of them has a family account, and none reads any lab's report as a first feature.

### Indian players

| Product | Explanation | Trends | Family | Doctor handoff | Reminders | Channels | Price |
| - | - | - | - | - | - | - | - |
| Redcliffe Labs | Smart report, annual report card | Annual card | Unverified, fee per person | Doctor consult | Unverified | Email, WhatsApp, app | VIP Rs 99, Gold Rs 499 |
| Orange Health | AI report layer, announced Aug 2026 | Announced | Unverified | Unverified | Unverified | WhatsApp, email, app | Unverified |
| Tata 1mg | Smart Report, plain English, AI assistant | Claimed | Booking discount for 2+ | Unverified | Medicine reminders | Email, WhatsApp | Care Plan, price unclear |
| Apollo 24\|7 | Flags abnormal values | Graphs of past values | Unverified | User controls access | Unverified | App, web | Circle Rs 199 a year |
| Practo | Upload only | Unverified | Plus covers 3 people for consults | Unverified | Medicine reminders | Email, app | Plus Rs 2,999 a year |
| MediBuddy | "Clear result interpretation" | Unverified | Gold covers 6 for consults | Unverified | Unverified | Email, SMS, WhatsApp | Gold, unverified |
| HealthifyMe | No lab feature found | | | | | | Healthify+ Rs 2,500 a year |
| Eka Care | Records analyser | Vitals | Unverified | Unverified | Unverified | | Unverified |
| DRiefcase | No explanation | No | One account for the family | Control who views, ABHA share | Vaccines only | | Free |

Sources:

- Redcliffe: "doctor-verified smart reports" ([Udaipur page](https://redcliffelabs.com/udaipur)), colour-coded reports ([home](https://redcliffelabs.com/)), an Annual Health Report Card with scores and yearly trends, Dec 2025 ([mediainfoline](https://www.mediainfoline.com/health/redcliffe-labs-launches-indias-first-annual-health-report-card-to-encourage-preventive-care-ahead-of-2026)), reports by email or WhatsApp ([Udaipur page](https://redcliffelabs.com/udaipur)), membership tiers ([membership](https://redcliffelabs.com/membership)).
- Orange Health: AI insights across markers and past reports, and upload of other labs' reports, announced 2026-08-20, launch unverified ([BioSpectrum](https://biospectrumindia.com/news/16/28349/orange-health-labs-launches-ai-powered-personalised-diagnostic-insights.html)). Reports on WhatsApp and email ([HDFC partner page](https://v.hdfc.bank.in/giga/offers/orange-health.html)).
- Tata 1mg: Smart Report and reports by email and WhatsApp ([test page](https://www.1mg.com/labs/test/comprehensive-gold-full-body-checkup-with-smart-report-2763)), plain-English explanation and AI trend tracking ([master health checkups](https://www.1mg.com/information/master-health-checkups)), medicine reminders ([download](https://www.1mg.com/download)).
- Apollo 24|7: analyses abnormal values, graphs from past values, user controls access ([health records](https://www.apollo247.com/guest-health-records)). Circle Rs 199 for 12 months, article from May 2025 ([blog](https://www.apollo247.com/blog/article/apollo-247-circle-membership-benefits)).
- Practo: upload of reports, medicine reminders ([health app](https://www.practo.com/health-app)), Plus prices ([plus](https://www.practo.com/plus)), reports by email ([tests](https://www.practo.com/tests)).
- MediBuddy: reports in 24 hours ([lab test](https://www.medibuddy.in/health-services/lab-test)), WhatsApp among channels ([terms](https://www.medibuddy.in/terms.html)).
- HealthifyMe: Healthify+ has no lab feature ([plan](https://store.healthifyme.com/products/healthifyplus-plan)).
- Eka Care: Medical Records Analyser ([for patients](https://www.eka.care/s/for-patients)). Hindi in the app is unverified.
- DRiefcase: one account for the family, consent-based sharing with ABHA, free, a Hindi site ([driefcase.com](https://www.driefcase.com/)).
- ABHA: link records, consent, share ([abha.abdm.gov.in](https://abha.abdm.gov.in/abha/v3/)). Consent with an expiry is unverified.

What this tells us:

- **Indian labs deliver reports on WhatsApp.** Redcliffe, Orange Health and Tata 1mg say so on their own pages. So the report a family wants to read is usually a PDF inside a WhatsApp chat.
- **Labs explain only their own reports.** Orange Health announced upload of other labs' reports in Aug 2026. No player found combines any lab's report, a family view and trends.
- **Membership prices are low.** Apollo Circle costs Rs 199 a year. A Rs 499 monthly plan competes with lab discounts, not with US memberships.

### Small trackers and community threads

Reddit (r/Biohackers, r/QuantifiedSelf) did not load for this research: the search tool rejected the domain and the page fetch was refused. These threads come from Hacker News and the Quantified Self forum.

| Thread | Date | What people asked for |
| - | - | - |
| [Ask HN: webapp to store blood test results](https://news.ycombinator.com/item?id=36025977) | 2023-05, about 57 comments | "manual entry sucks", graphs of past values, unit conversion, sharing with a doctor |
| [Launch HN: Be Golden](https://news.ycombinator.com/item?id=32650142) | 2022-08, 154 comments | One value is noisy, log medicines and supplements against a marker, a clear data-handling page |
| [Ask HN: personal health dashboard](https://news.ycombinator.com/item?id=36255910) | 2023-06, 40 comments | Data is "scattered around different places", one view for meds, glucose and A1C |
| [Show HN: AI blood test insights](https://news.ycombinator.com/item?id=43380749) | 2025-03, 12 comments | "questions to ask to your MD during next visit", what text is logged, AI accuracy |
| [Show HN: biotracker.me](https://news.ycombinator.com/item?id=42498550) | 2024-12, 4 comments | Labs name the same marker differently, privacy of uploads |
| [Show HN: Medical Exam Results Explained](https://news.ycombinator.com/item?id=37177084) | 2023-08, 5 comments | Why trust AI to read it, is data sent to an AI provider |
| [BloodTrack](https://news.ycombinator.com/item?id=43554906) | 2025-04, 2 comments | PNG and PDF uploads that fail |
| [Show HN: Vitality AI Health](https://news.ycombinator.com/item?id=47823461) | 2026-04, 2 comments | A summary for doctor visits |
| [Medical data trapped in an AI account](https://news.ycombinator.com/item?id=46675740) | 2026-01, 20 comments | Export your data on a schedule |
| [QS forum: InsideTracker review](https://forum.quantifiedself.com/t/insidetracker-review-blood-analytics-and-nutrition-recommendations/976) | 2014 | When to retest vitamin D after a supplement |

App-store listings found during the search (vendor text, not user evidence): BioMap reads a PDF or photo, charts each marker and has reminders for follow-up tests ([App Store](https://apps.apple.com/app/6780337778)). LabTracker logs supplements next to labs ([Product Hunt](https://www.producthunt.com/products/labtracker/makers)).

What this tells us:

- **The top pains are entry, names and units, trust, and trends.** MediWise already answers entry (Claude reads the file), names and units (the catalog), and trends.
- **A summary for the doctor visit comes up in three threads.**
- **No thread asked for retest reminders.** The case for reminders rests on report frequency, not on demand from users.

### Clinical retest intervals

These intervals assume a treatment context (a new medicine or a dose change). MediWise does not know about treatment, so a due date can only be a suggestion with "ask your doctor".

| Marker | Interval | Source |
| - | - | - |
| HbA1c, diabetes | At least twice a year at goal, at least every 3 months after a therapy change or when not at goal | ADA 2022, quoted by [US Pharmacist](https://www.uspharmacist.com/article/recommended-glycemic-targets-and-value-of-routine-monitoring). The 2026 text is unverified. |
| HbA1c, prediabetes | Every year | ADA 2018, via [AAFP](https://www.aafp.org/pubs/afp/issues/2018/0801/p187.html) |
| LDL after a statin | 4 to 12 weeks after a start or a dose change, then every 3 to 12 months | AHA/ACC 2018, via [NLA](https://www.lipid.org/resource/clinicians-should-monitor-ldl-c-after-starting-lipid-lowering-therapy/) |
| TSH after a levothyroxine change | From 6 weeks, then every 3 months, then yearly when stable | NICE NG145, via [NI Formulary](https://niformulary.hscni.net/formulary/6-0-endocrine/6-2-thyroid-and-antithyroid-drugs-and-parathyroid-disease/6-2-1-hypothyroidism/). ATA/AACE says 4 to 8 weeks ([Quest brochure](https://www.questdiagnostics.com/content/dam/corporate/unrestricted/documents/other/thyroid_summary_of_practice_guidelines_brochure/Thyroid_Summary_of_Practice_Guidelines_Brochure.pdf)). |
| eGFR and urine ACR, diabetes | Yearly, 1 to 4 times a year once CKD is found | [Cleveland Clinic Consult QD](https://consultqd.clevelandclinic.org/diabetes-and-chronic-kidney-disease-management-a-practical-primary-care-approach) |
| ALT, mildly raised | Repeat to confirm, no interval given | ACG 2017, via [Guideline Central](https://www.guidelinecentral.com/guideline/13290/) |
| Vitamin D, B12, ferritin after a supplement | Unverified | No fetched source gave an interval |

The current engine text "Retest in 8 to 12 weeks" has no source in the catalog. Draft 4 gives due dates only to markers with a sourced interval.

### Rules that apply

- **DPDP Act 2023 and DPDP Rules 2025.** The Rules were notified in Nov 2025. Most duties of a data fiduciary start 18 months later, about 13 May 2027 ([Rule 1, unofficial mirror](https://dpdpa.com/dpdparules/rule1.html), [Pyroniq timeline](https://www.pyroniq.ai/resources/dpdpa-compliance-timeline)). A MeitY proposal from Jan 2026 would move that to 13 Nov 2026. Whether it was notified is unverified ([S.S. Rana](https://ssrana.in/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs/)).
- **Children.** Rule 10 asks for verifiable consent of a parent before an app processes data of a person under 18 ([Rule 10, unofficial mirror](https://dpdpa.com/dpdparules/rule10.html), [KS&K](https://ksandk.com/md/data-protection-and-data-privacy/childrens-data-protection-under-indias-dpdp-rules/)). The health exemption covers clinical establishments and doctors ([Storyboard18](https://www.storyboard18.com/amp/digital/dpdp-rules-carve-out-key-exemptions-for-healthcare-providers-schools-and-childcare-services-processing-childrens-data-84208.htm)). MediWise is probably not a clinical establishment. This is an inference, not legal advice. It applies to child profiles today, not only to new features.
- **Erasure and logs.** Erase data when consent is withdrawn or the purpose is served, and make processors erase too (Section 8(7), [mirror](https://dpdpa.com/dpdpa2023/chapter-2/section8.html)). Rule 8 asks for 48 hours of notice before erasure and logs kept for at least one year ([Rule 8, mirror](https://dpdpa.com/dpdparules/rule8.html)).
- **Processors.** The fiduciary stays responsible for its processors ([Section 8](https://dpdpa.com/dpdpa2023/chapter-2/section8.html)). A message through Meta or a link a doctor opens is MediWise's responsibility.
- **Notice.** A clear, separate notice in simple language with the purpose and how to withdraw consent ([SCC Online](https://www.scconline.com/blog/post/2025/12/26/digital-personal-data-protection-rules-2025-key-highlights/)).
- **Medical device software.** CDSCO's draft guidance on medical device software (Oct 2025) covers software for diagnosis, monitoring or treatment, with AI diagnostic software as a Class C example ([India Briefing](https://india-briefing.com/news/cdsco-draft-guidance-medical-software-40691.html)). Whether a lab-report explainer falls under it is unverified. Copy that suggests a diagnosis or a treatment raises this risk.
- **Telemedicine Practice Guidelines 2020.** AI platforms may not counsel patients or prescribe ([MediaNama](https://www.medianama.com/2020/03/223-summary-india-telemedicine-guidelines/)).

Every feature below is written to be built to follow these rules. None of this document says MediWise meets them.

## Ranking method

Each candidate gets four value scores from 0 to 3, one risk level and one effort size.

| Factor | Weight | 0 | 3 |
| - | - | - | - |
| Report frequency: does it bring the next upload sooner? | 3 | No effect | Directly prompts or eases an upload |
| Family use: does it make the account useful for more profiles? | 3 | One person only | Built around the family |
| Pain evidence: do users or the field ask for it? | 2 | No evidence | Several sources |
| Difference: does the field do it badly for a family with any lab's report? | 1 | Everyone does it | No one does it |

- Value = 3 x frequency + 3 x family + 2 x pain + 1 x difference. The maximum is 27.
- Risk penalty: Low 0, Medium 2, High 5. Risk covers medical claims, DPDP and data retention.
- Effort divisor: S 1 (half a session), M 1.5 (one session), L 2.5 (more than one session).
- **Score = (value - risk penalty) / effort divisor.**
- A tie goes to the higher pain score, then the lower risk.

Frequency and family carry weight 3 because the maintainer asked to weigh features by report frequency and family use on 2026-10-13. More reports and more profiles also mean more credits used.

Check of the weights: with family at weight 1 instead of 3, the same five features stay in the top five. Only their order changes.

| Feature | Freq | Family | Pain | Diff | Value | Risk | Effort | Score |
| - | - | - | - | - | - | - | - | - |
| Family overview on Home | 2 | 3 | 2 | 3 | 22 | Low | M | 14.7 |
| Share from WhatsApp into upload | 3 | 2 | 2 | 2 | 21 | Low | M | 14.0 |
| "Since last visit" on the doctor export | 1 | 1 | 3 | 1 | 13 | Low | S | 13.0 |
| Retest due dates with a calendar file | 3 | 2 | 2 | 2 | 21 | Medium | M | 12.7 |
| Photo checks at upload | 1 | 1 | 2 | 1 | 11 | Low | S | 11.0 |
| Share-with-doctor link with expiry | 1 | 1 | 3 | 2 | 14 | Medium | M | 8.0 |
| Year in review per profile | 1 | 2 | 1 | 1 | 12 | Low | M | 8.0 |
| Lab change note on trends | 0 | 0 | 3 | 1 | 7 | Low | S | 7.0 |
| Hindi copy | 1 | 3 | 1 | 2 | 16 | Medium | L | 5.6 |
| Medication and supplement log | 2 | 1 | 2 | 2 | 15 | Medium | L | 5.2 |
| CSV download of all values | 0 | 0 | 2 | 1 | 5 | Low | S | 5.0 |
| Symptom notes per visit | 0 | 1 | 1 | 1 | 6 | Medium | S | 4.0 |
| WhatsApp Business delivery | 2 | 2 | 1 | 0 | 14 | High | L | 3.6 |
| Export to Apple Health or Health Connect | 0 | 0 | 1 | 0 | 2 | Low | L | 0.8 |

## Candidates

### 1. Family overview on Home (14.7)

- **Problem.** The person who manages reports for parents must switch profile to see each person. Nothing shows who has no recent report.
- **Others.** Function Health, Superpower and InsideTracker have no family account (sources above). DRiefcase holds the family's records but explains nothing ([driefcase.com](https://www.driefcase.com/)). Practo Plus and MediBuddy Gold cover family consults, not reports.
- **Build.** A "Your family" section on Home with one row per profile: name, relation, latest score and tier, the number of markers at risk, and the date of the latest report. A profile with no report in 12 months shows "No report in the last 12 months". A row opens that profile's Home. One API read returns all rows.
- **Effort.** M. **Claude cost.** None.
- **Risk.** Low. The data is already shown one profile at a time. The "no report in 12 months" line names a date, not a medical need.
- **Why it ranks first.** It is the feature the field lacks, and each stale row is a prompt to upload a report for a parent.

### 2. Share a report from WhatsApp into MediWise (14.0)

- **Problem.** Indian labs send the report as a PDF in WhatsApp (Redcliffe, Orange Health, Tata 1mg, sources above). Today the user saves the file, opens MediWise, finds the file and uploads it.
- **Others.** No player found takes a shared file from another app into a web app. InsideTracker asks for a manual upload ([platform](https://store.insidetracker.com/products/insidetracker-platform)).
- **Build.** Add `share_target` to `site.webmanifest` and a small service worker. On an installed MediWise on Android, "Share" in WhatsApp lists MediWise. The shared PDFs and photos open on the upload page with the active profile picked. The user confirms and the normal read starts. Files go through a POST, so they need a service worker ([MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target), [Chrome](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)).
- **Reach.** Android had 93.89% of mobile in India in Sep 2026 ([StatCounter](https://gs.statcounter.com/os-market-share/mobile/india)). iOS Safari does not list support ([Chrome](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)). The app must be installed first.
- **Effort.** M. **Claude cost.** None new. The upload is one normal read.
- **Risk.** Low. The service worker must not cache API responses, so no health data stays in the browser cache.

### 3. "Since last visit" on the doctor export (13.0)

This is the pre-visit one-page summary from the ticket list. Most of it exists: the export page already has move first, patterns and questions for the doctor.

- **Problem.** A doctor asks "was it higher last time?". The export shows one report only, so the user opens a second tab.
- **Others.** Function Health offers a PDF of results ([FAQ](https://www.functionhealth.com/faq)). HN threads ask for a summary for the visit ([1](https://news.ycombinator.com/item?id=43380749), [2](https://news.ycombinator.com/item?id=47823461)).
- **Build.** On `/reports/$reportId/export`, add the value from the profile's previous report and its date for each marker, with an up or down mark. One line at the top names the earlier report. A first report shows no extra column.
- **Effort.** S. **Claude cost.** None. The engine and the stored reports hold the values.
- **Risk.** Low. The column shows printed values. It adds no claim.

### 4. Retest due dates with a calendar file (12.7)

- **Problem.** The engine says "Retest in 8 to 12 weeks" but keeps no date. A family tests once a year and forgets the follow-up.
- **Others.** Function Health sells two tests a year and sends text reminders ([FAQ](https://www.functionhealth.com/faq)). Superpower includes one retest ([FAQ](https://superpower.com/faqs)). BioMap has reminders for follow-up tests ([App Store](https://apps.apple.com/app/6780337778)). InsideTracker gives guidance only.
- **Build.** A sourced retest interval in the catalog, first for HbA1c, eGFR and urine ACR. The LDL and TSH intervals depend on a medicine change MediWise cannot see, so they wait. A due date per marker from the report's collection date. A "Due for retest" list on Home for the active profile. An "Add to calendar" button that downloads an `.ics` file, so the phone calendar does the reminding. No email, no push. A marker without a sourced interval keeps today's text and gets no date.
- **Scope change.** PRODUCT.md lists reminders as out of v1. The draft moves "retest due dates and a calendar file" into v1 and keeps push and email out.
- **Effort.** M. **Claude cost.** None.
- **Risk.** Medium. A date reads like advice. Every date says "Ask your doctor before you book a retest". Intervals come from the catalog with a source, like ranges.
- **Money.** One extra test per profile per year is one more credit, Rs 29.95 to Rs 49.

### 5. Photo checks at upload (11.0)

- **Problem.** A dark or blurred photo fails or reads wrong. The dashboard screenshot shows two "Could not read" reports. A failed read refunds the credit but costs the user time and costs MediWise the Claude call.
- **Others.** No product found checks a photo before upload. HN users report failed uploads ([BloodTrack](https://news.ycombinator.com/item?id=43554906)) and doubt OCR accuracy ([Ask HN](https://news.ycombinator.com/item?id=36025977)).
- **Build.** In the browser, for each JPG or PNG: check the size in pixels, the brightness and a blur score on a small canvas copy. Show a warning on the file row with one fix. The user can still upload. Three tips in the drop zone. HEIC is skipped because Chrome cannot draw it.
- **Effort.** S. **Claude cost.** None. A Haiku check of one photo would cost about 0.02 cent, but the browser check is free and instant.
- **Risk.** Low. The photo never leaves the browser for the check.

### 6. Share-with-doctor link with expiry (8.0)

- **Problem.** The doctor export needs sign-in, so the user prints it or sends a screenshot.
- **Others.** Function Health and Superpower offer a PDF or staff help, no link ([Function FAQ](https://www.functionhealth.com/faq), [Superpower FAQ](https://superpower.com/faqs)). Apollo 24|7 lets the user control access ([health records](https://www.apollo247.com/guest-health-records)). ABHA consent with an end date is unverified.
- **Build.** "Share with your doctor" makes a link to a read-only copy of the export. It ends after 7 days by default. The user can end it early. A list shows each open link and when someone opened it. A "Send on WhatsApp" button opens a `wa.me` link with the URL, which costs nothing and needs no Meta account.
- **Effort.** M. **Claude cost.** None.
- **Risk.** Medium. A link can leak. The token must be long and random, the page `noindex`, the default expiry short. MediWise stays responsible for the disclosure under DPDP Section 8. The export already prints well, which lowers the need.

### 7. Year in review per profile (8.0)

- **Problem.** Most families test once a year, so they see one report and forget the last one.
- **Others.** Redcliffe launched an Annual Health Report Card with yearly trends in Dec 2025 ([mediainfoline](https://www.mediainfoline.com/health/redcliffe-labs-launches-indias-first-annual-health-report-card-to-encourage-preventive-care-ahead-of-2026)). PRODUCT.md lists "story recap" as out of v1.
- **Build.** For each profile with two or more reports in 12 months: score change, markers that moved between bands, markers still at risk. Engine data first. One Haiku call can write a short intro under the narrative validator.
- **Effort.** M. **Claude cost.** About 0.1 cent per profile per year, the size of one narrative.
- **Risk.** Low. Overlaps with Compare. With one report a year there is nothing to review, so the value is low until users test more often.

### 8. Lab change note on trends (7.0)

This is the remaining part of lab-to-lab range normalisation. Units and calibrated ranges are already built.

- **Problem.** Two labs can print different ranges and methods for the same marker. A jump on a trend chart can come from the lab change.
- **Others.** HN users name this pain ([Ask HN](https://news.ycombinator.com/item?id=36025977), [biotracker.me](https://news.ycombinator.com/item?id=42498550)).
- **Build.** On a trend chart, mark a point where the lab name changes and show both lab ranges in the tooltip.
- **Effort.** S. **Claude cost.** None. **Risk.** Low.

### 9. Hindi copy (5.6)

- **Problem.** Many parents read Hindi more easily than English.
- **Others.** DRiefcase has a Hindi site ([driefcase.com](https://www.driefcase.com/)). Eka Care's Hindi in the app is unverified. Lab reports found are in English.
- **Build.** An i18n layer, Hindi UI strings, Hindi catalog text for every marker, a Hindi narrative.
- **Effort.** L. The catalog has four text fields per marker, and each needs a medical review in Hindi.
- **Claude cost.** About 0.2 to 0.3 cent per report for a Hindi narrative on Haiku. This is an estimate: Devanagari uses more tokens than English for the same text.
- **Risk.** Medium. The STE validator checks English only, so a wrong translation passes unseen. A wrong medical word misleads.

### 10. Medication and supplement log against markers (5.2)

- **Problem.** "Did my vitamin D go up because of the supplement?"
- **Others.** HN asks for it ([Be Golden](https://news.ycombinator.com/item?id=32650142)). LabTracker logs supplements next to labs ([Product Hunt](https://www.producthunt.com/products/labtracker/makers)). 1mg and Practo have medicine reminders, not marker links.
- **Build.** A log of start and stop dates per profile, drawn as bands on the trend chart.
- **Effort.** L. **Claude cost.** None.
- **Risk.** Medium. Medication data is sensitive. The app must not suggest a dose or a link between a medicine and a value. PRODUCT.md lists medications as out of v1.

### Below the top 10

- **CSV download of all values (5.0).** One file per profile with every value. Answers the "data trapped" thread ([HN](https://news.ycombinator.com/item?id=46675740)) and fits an open-source project. S, no Claude, low risk.
- **Symptom notes per visit (4.0).** A free-text note on a report, shown on the export. S, no Claude. Medium risk: free-text health data, and Claude must never read it, or MediWise starts to interpret symptoms.
- **WhatsApp Business delivery (3.6).** Send the summary through the WhatsApp Business Platform. Meta charges per delivered template since 2025-07-01 ([Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)). Third parties quote Rs 0.115 to Rs 0.145 per utility message, unverified ([ChatMaxima](https://chatmaxima.com/whatsapp-api-pricing/india/), [AiSensy](https://m.aisensy.com/blog/whatsapp-pricing-update-october-2026/)). Some providers say messages inside the 24-hour window become paid from 2026-10-01, unverified ([Zoho](https://help.zoho.com/portal/en/community/topic/whatsapp-business-platform-pricing-changes-%e2%80%93-effective-october-1-2026)). L: business verification, template approval, opt-in. High risk: Meta becomes a processor of health data, and a message in a chat cannot be erased. The `wa.me` button in candidate 6 gets most of the value at no cost.
- **Export to Apple Health or Health Connect (0.8).** Not possible from a web app. Apple clinical records are read-only to apps ([Apple](https://developer.apple.com/documentation/healthkit/accessing-health-records)). Health Connect is an on-device Android API ([Android](https://developer.android.com/health-and-fitness/health-connect/availability)). Both need a native app, which PRODUCT.md keeps out of v1. Revisit with a native Android app. CSV covers portability until then.

## Open items outside the ranking

- **Consent for child profiles.** DPDP Rule 10 likely applies to every profile under 18 that exists today. Plan a ticket before 13 May 2027, or before 13 Nov 2026 if MeitY's shorter timeline is in force.
- **Consent of adult family members.** A parent's report is the parent's data. The profile form can ask the account owner to confirm they have the family member's permission.
- **Erasure log.** Rule 8 asks for logs kept for at least one year. Account deletion exists. This research did not check for a deletion log.
- **Reddit evidence.** r/Biohackers and r/QuantifiedSelf did not load. A manual read of three threads would test the pain scores.
