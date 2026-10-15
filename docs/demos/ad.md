# Product ad (MEDI-146)

One 30-second ad for MediWise in two cuts from the same scenes: 1920 x 1080 for desktop and 1080 x 1920 for an Instagram reel. The Remotion project is at `~/Work/mediwise-promo/ad`, outside this repo. The rendered files are in `~/Work/mediwise-demos/ad`.

## Brief

**Audience.** Families in India who get lab reports and cannot read them: the adult who manages the reports of parents, partner and children. Second, the doctors they visit, who get a clean summary.

**The one promise.** Every marker explained and scored, tracked over time, shared with your doctor.

**Headline.** "Your lab report, explained marker by marker." This is the landing page hero (`apps/landing/src/config/messages/en/hero.ts`). The ad uses it on the first frame and the end card.

**Tone.** Calm, plain and exact, as on the landing page and in DESIGN.md: "A calm health tool. Low saturation, warm neutrals, borders instead of shadows, one accent." No hype words, no alarm, no countdowns. Short sentences of 9 words or fewer on screen.

**Claims limit.** Only what `docs/PRODUCT.md` and the landing copy say. Never "diagnosis" or "false positive". The end card carries the full disclaimer from the landing page: "MediWise is for information, not diagnosis. It does not replace a doctor."

**Brand.**

| Part | Value | Source |
| - | - | - |
| Page | `#FBFAF7` background, `#FFFEFD` card, `#E0DDDA` border | `packages/design-tokens`, DESIGN.md Palette |
| Text | `#201C19` foreground, `#68625E` muted | same |
| Accent | `#176B6B` teal, the one accent | same |
| Status | optimal `#31693F`, watch `#875814`, risk `#A63C0C`, results only | same |
| Type | Instrument Serif for the one headline of a scene, Inter for captions, JetBrains Mono for values | DESIGN.md Type |
| Mark | The drop with a reading line, `apps/web/public/favicon.svg`, teal on the background | DESIGN.md Brand |
| Wordmark | "MediWise" in Inter SemiBold, letter spacing -0.025em | DESIGN.md Brand |
| URL | `mediwise.theyashgupta.me` | NOTES.md, MEDI-50 |

**Motion.** Transforms and opacity only, as on the landing page. Transitions come from the brand: the teal reading line of the mark wipes from one scene to the next. The camera holds, then makes one slow ease-in-out move of at least 1.5 s to the UI element the caption names, at 1.3x or less, and only over still footage. No stock whooshes, no glitch, no 3D spins.

**Footage.** Caption-free raw captures from `~/.cache/record-flow/jobs/<slug>-<ts>/video/raw.mp4` (desktop, 3840 x 2160) and `video-phone/raw.mp4` (phone, 1170 x 2532), newest job per slug. Only the demo profile Arjun Mehta and the lab Sunrise Diagnostics show. The hook uses page 1 of `apps/api/fixtures/golden/sample-2025.pdf`, the made-up fixture behind the demo report.

**Device frames.** Front-on frames with no perspective, rotation or shadow. The footage is clipped hard to the screen rectangle and shown at an integer fraction of the capture, so it stays sharp. Desktop: a laptop whose screen is 1280 x 720, a third of the 3840 x 2160 capture. Reel: a phone whose screen is 585 x 1266, half of the 1170 x 2532 phone capture. Trends, share and Hindi have no phone take, so the reel shows those desktop takes at a third of their size, as on the laptop, in a full-width browser card with a 1080 x 720 window. At that scale the whole content column of the page fits.

**Audio.** A calm royalty-free music bed, about 90 to 110 BPM, piano or soft plucks, with a licence that allows commercial use without attribution (Pixabay Content License). No voice: most reel views are muted, and the captions carry the story. A Kokoro voice can come in a later cut if the orchestrator asks for it.

**Captions.** Burned in, kinetic, word by word, in Inter SemiBold. Desktop captions sit in one line in a band above the laptop. Reel captions sit inside the safe zone: 150 px free at the top, 170 px free at the bottom.

## Storyboard

30 fps, 900 frames, 30 seconds. The same scene list drives both cuts. Every cut falls on a multiple of 18 frames, one beat of the 100 BPM music bed. "Source" is the raw capture and its time in seconds. This is the storyboard as built, after the review below.

| Beat | Time | Visual (desktop) | Visual (reel) | Source | Caption on screen |
| - | - | - | - | - | - |
| 1. Hook | 0:00 to 0:03.6 | Frame 0 already shows the lab PDF page (Sunrise Diagnostics) over the laptop, with the teal reading line part way down. Three rows turn into scored markers: Vitamin D (25-OH) 13 ng/mL Risk, Folate 5.2 ng/mL Optimal, Vitamin B12 380.2 pg/mL Optimal. From 0.7 s the page shrinks into the screen as the report wipes in: score 89 Platinum and the verdict line, complete at 1.3 s. The camera does not move in the hook. | The same, with the phone report: score ring 89 and "67 of 81 markers sit in your calibrated ranges". | Fixture PDF page 1. Desktop `report-page` 0 to 1.5 s at 0.45x. Phone `report-page` 8.4 to 10.2 s at 0.55x. | "Your lab report," then "explained marker by marker." |
| 2. Explained and scored | 0:03.6 to 0:11.4 | "Move first", then a 1.2x push to the rows and their plain descriptions. At 0:07.2, cut to the LDL cholesterol marker page and a 1.2x push to the "Where you sit" bar with the lab range and the calibrated range. | Phone report: "Move first", then a 1.05x push to the rows. Then the LDL cholesterol page and a 1.05x push to its "Where you sit" bar. | Desktop `report-page` 35.85 to 38.3 s at 0.6x and 54 to 58 s at 0.85x. Phone `report-page` 38.4 to 40.6 s at 0.55x and 60.2 to 63 s at 0.6x. | "Every marker, in plain words." then "Scored for your age, sex and ancestry." |
| 3. Tracked over time | 0:11.4 to 0:15.6 | Trend of LDL cholesterol: the title, "+14 mg/dL (+10.3%) since the report before", "Worsening", the line, the optimal band and the table, then a 1.2x push to the chart. | Browser card: the whole trend page, held still. | `trend-detail` 12.6 to 15.4 s at 0.6x. | "Tracked across every report." |
| 4. Shared with your doctor | 0:15.6 to 0:20.4 | "Share with your doctor" dialog, open from the first frame: "Your doctor can open this link without an account.", the link, "Copy", "End link" and "Send on WhatsApp", then a 1.25x push to the score, the verdict and the dialog. | The same push in the browser card. | `share-with-doctor` 8.45 to 13.7 s. The recording shows the dev host in the link field, so the field shows the production form of the same link (see Review). | "Share it with your doctor." then "One link. No account needed." |
| 5. Hindi | 0:20.4 to 0:25.2 | Match cut: the English report summary at the share framing, then at 0:21.6 the reading line wipes in the same summary in Hindi at the same framing. The score 89 stays in place and the verdict turns to Hindi. | The same match cut in the browser card. | `report-page` 0 to 0.75 s at 0.45x, then `hindi-language` 49.05 to 53.25 s. | "In English or हिन्दी." |
| 6. End card | 0:25.2 to 0:30 | The reading line wipes the frame. The drop mark scales in with its reading line, the wordmark "MediWise" sets beside it, the headline follows, then the URL and the disclaimer. Holds 3.1 s. | Same, stacked in the middle of the safe zone. | Brand assets. | "Your lab report, explained marker by marker." `mediwise.theyashgupta.me` "MediWise is for information, not diagnosis. It does not replace a doctor." |

Why this order: the hook shows the product turning a report into an answer within 1.2 seconds. Beat 2 holds the longest, because "explained and scored" is the moment only MediWise gives. Tracking, sharing and Hindi then answer "what next" in quick steps, and the end card closes with the landing headline, not a new slogan.

Every on-screen string is real UI copy from the footage, landing copy, or a caption above. The captions use only promises from `docs/PRODUCT.md` and the landing page: "explains every marker", "scores it for your age, sex and ancestry", "tracks each marker across visits", "Share with your doctor", "plain English or Hindi".

## Review

Four critic agents (design, readability, pacing, brand) reviewed 50 frames of the first draft of both cuts, as the product-launch-video skill sets out. The findings and the fixes:

| Finding | Critics | Fix |
| - | - | - |
| The share link showed `http://localhost:5173/share/...` from the dev recording. | all four | The field shows `https://app.mediwise.theyashgupta.me/share/...`, the production form of the same link. `shareUrl` in `apps/web/src/modules/reports/config/share.ts` builds it from the app origin. |
| Zoomed crops cut words at the screen edge, and the reel crops showed empty chart areas. | design, brand, readability | Each camera frames one whole component. The second review below replaced the edge fades and the high reel zooms. |
| Frame 0 was an empty background, and the report arrived late. | pacing | The page and the device are in place on frame 0, with the reading line part way down. The report is complete at 1.3 s. |
| The hook chips overlapped, and the chips and the page had heavy shadows. | design, brand | The chips are spaced by their own height and use borders only. The page has one light shadow and fades out at its cut edge. |
| A score tooltip covered the verdict on the phone, and a focus ring showed on desktop. | design, readability, brand | The hook uses footage windows before the hover, played slower: desktop 0 to 1.5 s at 0.45x, phone 8.4 to 10.2 s at 0.55x. |
| "What your report says" showed pattern names that read like a diagnosis, in small text. | brand, pacing, readability | The beat shows "Move first" and its plain descriptions, close up. |
| The "Where you sit" bar was short and small. Desktop and reel showed different markers. | pacing, readability | Both cuts show the LDL cholesterol bar for 4.2 s and move to it. The LDL trend follows. |
| The tracked beat was long and flat. | pacing | It is 4.2 s, with the whole chart on desktop and a pan across both values in the reel. |
| The share dialog opened late, under its caption. | pacing | The shot opens on the open dialog. |
| The Hindi dropdown was 1.5 s of small, clipped UI. | pacing, design, readability | A match cut from the English summary to the Hindi summary at the same framing. |
| Cuts did not fall on the music. | pacing | Every cut is on a multiple of 18 frames (100 BPM). |
| Captions broke with one word alone on a line. | readability | Every caption has hand-set line breaks per cut. |
| The disclaimer was one sentence and small. The wordmark was too large for the mark. The mark showed without its reading line. | brand, readability | The full disclaimer at 28 px (desktop) and 36 px (reel). The wordmark to mark ratio is 0.625, as in the app logo. The line draws as the drop scales in. |
| Colours outside the tokens (a teal glow, device greys, pure white). | brand | Removed the glow. The devices and the page use `foreground`, `muted`, `input`, `sidebar` and `card`. |

Not changed: the cursor of the recordings shows in some shots. The footage has no clean take without it, and no dev server may run for a new take.

### Second review: camera and device frames

Yash reviewed the renders and asked for two changes. Both cuts and the GIF were rendered again, and the four critics reviewed the new renders (third table).

| Feedback | Change |
| - | - |
| The zooms were bad. | Every camera move is one ease-in-out of 52 to 56 frames (1.7 to 1.9 s), after a hold of 24 frames from the cut, 10 of them after the wipe. The largest zoom is 1.25x (share and Hindi), the desktop pushes are 1.2x and the phone pushes 1.05x. Each move ends on the element its caption names. The hook has no camera move. A frame-to-frame check of every footage window (largest local change, so the cursor counts) sets each move inside a still window: no scroll, no dialog, no cursor. |
| The footage in the laptop looked tilted, with blurred edges. | The tilt on the hook page and the feathered edge mask on zoomed shots are gone. The device and page shadows are gone. The footage is clipped hard to the screen and placed on whole pixels. The laptop screen is 1280 x 720 and the reel card window 1080 x 720, both a third of the capture. The phone screen is 585 x 1266, half of the capture. The desktop captions moved to a band above the larger laptop. |

The four critics then reviewed the new renders. All four of Yash's checks passed (front-on and crisp, integer scales, 1.3x or less, no hook zoom), and the reel text stays between y 150 and y 1750. Their other findings and the fixes:

| Finding | Critics | Fix |
| - | - | - |
| Four camera moves ran while the recorded cursor or a tooltip moved. | pacing | New footage windows, from a cursor-sensitive motion scan: `report-page` 35.85 s at 0.6x, phone `report-page` 38.4 s at 0.55x, `trend-detail` 12.6 s at 0.6x. |
| The reel card cut words at its edges and panned across an empty chart. | design, readability, brand | The card shows the capture at a third of its size, like the laptop, so the whole content column fits. The trend holds still on the whole page. Share and Hindi use one framing whose edges fall on whitespace. |
| Desktop pushes cut the breadcrumb and the sidebar labels. The share and Hindi framing sliced the header card and the action buttons. | design, readability | Desktop pushes are 1.2x (page x 270 to 1870). Share and Hindi frame page x 302 to 1838, y 216 to 1080. |
| The 1.1x phone push cut the first letters of the phone UI. | design, readability, brand | The phone pushes are 1.05x, which keeps the app's 16 px padding in view. |
| The screens went blank under the end wipe and the phone fade. | pacing | The last shot of each screen keeps playing under the transition. |
| The caption band was empty for 7 to 10 frames at every cut. | design | Each caption leaves 3 frames after the next one starts. |
| Two cuts (200, 670) were off the 18-frame grid. | pacing | They are at 216 and 648. |
| The hook page faded at its cut edge, had a shadow, and the reading line crossed the Liver heading. | design, brand | The page ends on a full row with a hard edge and a border only. The line stops above the heading. |
| The desktop end card showed the reading line already drawn. | brand | Two marks shared one SVG mask id. Each mark now has its own id. |
| The Hindi thread post claimed more than the landing page. The Instagram caption had half the disclaimer. | brand | Both now match the landing copy (below). |

Not changed: the desktop hook shows the app's own serif page title under the serif headline, which is product footage. The share-link claim ("One link. No account needed.") rests on the UI copy of the share dialog, "Your doctor can open this link without an account.", because the landing page does not mention share links.

## Social copy

Every claim below comes from the landing copy (`apps/landing/src/config/messages`) or from the ad itself. Post the reel with the 9:16 file and the other posts with the 16:9 file.

**X, with the 16:9 video (under 280 characters):**

> A lab PDF gives you numbers. MediWise tells you what they mean.
>
> Upload your report as a PDF or photos. Every marker is explained in plain English or Hindi, scored for your age, sex and ancestry, and tracked across visits.
>
> mediwise.theyashgupta.me

**X reply thread, one post each:**

1. You can add up to 20 files to one report: PDFs, or phone photos of the pages.
2. Each marker has its own page. It says what the marker is, why it matters and what moves it, and lists its sources.
3. The report opens with a score and the markers to work on first.
4. Trends show each marker across visits, with your optimal range as a band.
5. Share a report with your doctor as a link. They open it without an account. You can also print one clean page, black on white.
6. The app, the marker explanations and the report summary show in Hindi. Marker names stay as the lab prints them.
7. MediWise is for information, not diagnosis. It does not replace a doctor.

**LinkedIn, with the 16:9 video:**

> Most lab reports arrive as a PDF full of test names and numbers, and the printed range is the only hint about what they mean.
>
> MediWise reads the report for you. Upload a PDF or photos, and each marker comes back explained in plain English or Hindi. The score uses ranges for your age, sex and ancestry, with a published source for each range.
>
> When the next report comes in, you can see how each marker moved since the last visit. Before a doctor visit, send the report as a link. Your doctor opens it without an account.
>
> You can keep a profile for each person in your family.
>
> MediWise is for information, not diagnosis. It does not replace a doctor.
>
> mediwise.theyashgupta.me

**Instagram reel caption, with the 9:16 video:**

> Your lab report, explained marker by marker.
>
> Upload a PDF or photos. Every marker in plain words, scored for you, tracked across reports. Send it to your doctor in one link. In English or हिन्दी.
>
> Link in bio: mediwise.theyashgupta.me
>
> MediWise is for information, not diagnosis. It does not replace a doctor.
>
> #labreport #bloodtest #healthcheckup #familyhealth

**Hindi line, for a Hindi post or the reel's first comment (the landing page headline):**

> आपकी लैब रिपोर्ट, हर मार्कर आसान भाषा में।

**Short line for the GIF embed:**

> A lab report, turned into every marker explained and scored.
