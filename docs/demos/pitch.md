# Doctor pitch video

One narrated film that shows a doctor the MediWise features that matter in a clinic. It is cut from the raw captures of the feature demos (see `features.md` and `README.md`), with a new narration for doctors.

- File: `~/Work/mediwise-demos/pitch/doctor-pitch-1080p.mp4` (1920 x 1080). The 4K master is pending, see `README.md`.
- Duration: 3:40.
- Remotion project: `~/Work/mediwise-promo/pitch` (its own git repository). `script.json` in that project is the source of the narration, the captions and the script below.
- Data on screen: the demo account only (Arjun Mehta, Meera Mehta, Sunrise Diagnostics) and the made-up fixtures.

## Features

The film shows 10 features, in this order. The number in brackets is the source video in `README.md`.

| # | Feature | Why a doctor cares |
| - | - | - |
| 1 | The report page (11) | The patient arrives with the whole report sorted, and the markers to look at first are on top. |
| 2 | One marker explained (13) | Each value shows the lab range beside a calibrated range, and every range names its source. |
| 3 | Scans and ECG with the blood values (14) | The impression and findings of a scan stay word for word next to the blood values of the same visit. |
| 4 | Trends over time (22, 23) | The direction of a value across years is on one chart, not spread over many PDFs. |
| 5 | Compare two reports (24) | What improved, worsened or is new between two visits fits on one screen. |
| 6 | Episodes (25) | A month of tests for one problem reads as one timeline, with the first and last value of each repeated marker. |
| 7 | Second opinions and settled alerts (28) | An alert that a later study answered shows as settled, with both printed lines and their dates. |
| 8 | The doctor export (29, with the visit note of 16) | One black and white summary with lab and calibrated ranges, the previous value, the patient's note and questions. |
| 9 | A report shared with a link (30, 31) | The doctor opens the summary from a link with no account, and the link ends on a set date. |
| 10 | Due for retest (20) | The patient keeps the next test date for a few markers in their own calendar, and is told to ask the doctor first. |

The closing shows that the data belongs to the family (32) and that MediWise works in Hindi (34).

## Script

Twelve paragraphs. Each sentence is one caption of 20 words or fewer. The voice is Kokoro `af_heart`, the voice of `record-flow`.

**Opening.** MediWise is for families who keep their lab reports and want to understand them. It reads each report and explains every marker in plain words. For you, the doctor, it means a patient who arrives with a cleaner picture.

**1. The report page.** Each report opens with a score, a one line verdict and what changed since the last visit. Move first ranks the markers to look at, in order. Then every marker sits in its body group, marked optimal, watch or risk.

**2. One marker explained.** Every marker has its own page. The bar shows the range the lab printed, beside a range calibrated for this person. Every range names its source, so you can see where it comes from.

**3. Scans and ECG with the blood values.** Ultrasound, X-ray and ECG reports sit beside the blood values of the same visit. MediWise copies the impression and the findings word for word, as the lab printed them. It says plainly that it does not read the images or the traces.

**4. Trends over time.** With two reports or more, every marker gets a trend. One chart shows each value over the years, against the optimal band for this profile.

**5. Compare two reports.** Compare puts two reports side by side. A summary counts what improved, what worsened and what is new, and Changed only hides the rest.

**6. Episodes.** Many tests in a few weeks can be grouped as one episode. The timeline lists every report in date order, with each repeated marker and its first and last value.

**7. Second opinions and settled alerts.** When a later study answers an earlier alert, MediWise marks that alert as settled. Settled shows both printed lines, with the date and the lab of each study. A repeat or a second opinion can also be linked by hand.

**8. The doctor export.** Export for doctor gives one black and white summary of a report. Every marker shows the lab range, the calibrated range and the value from the report before. The questions for you and the patient's own note for the visit are on the page too. It prints, or saves as a PDF.

**9. A report shared with a link.** A patient can also send a report to you as a link. You open it with no account, and see the same summary as the export. Each link ends on a set date, and the patient can end it at any time.

**10. Due for retest.** For a few markers with a sourced retest interval, Home shows when the next test is due. Add to calendar puts the date in the patient's own calendar. The list asks them to check with their doctor before they book.

**Closing.** The data belongs to the family. They can download every value, share a report, or delete the account and every file in it. And MediWise works in Hindi, so parents and grandparents can read their own reports. MediWise is for information. It does not replace a clinician.

## Structure

- A title card with the logo and the landing page headline, under the first sentence.
- One chapter card per feature (2 seconds, number, name and the reason above), then one clip per sentence.
- Each clip holds for its sentence plus a short pause, never under 3 seconds. The camera pushes in slowly on the click point or the part the sentence names.
- Word captions at the bottom, in Inter, one sentence at a time.
- An end card with `mediwise.theyashgupta.me` under the last sentence.
- A quiet music bed, made by `scripts/music.py` in the project, so no third-party license applies. It drops under the voice.

## Wording limits

The script uses the words of `docs/PRODUCT.md` and `docs/DESIGN.md` only. It never says that MediWise finds or names a disease. It keeps the product disclaimer in the last sentence.
