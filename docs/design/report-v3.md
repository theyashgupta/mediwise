# Report page v3: show less, open more (MEDI-156)

## Problem

The before pages are `docs/design/pages/after-report-light.jpg`, `after-report-light-phone.jpg` and `after-report-studies-light.jpg`. The page shows all sections open, one after the other. The 1440 px page is 11,000 px high. The 390 px page is 17,800 px high. The reader sees links, the episode form and the note before the findings. Studies show every measurement and every printed line. The marker list shows 81 rows in 17 groups.

## Paradigm: a summary band, then a stack of folds

One pattern for every section: a fold. A fold is a native `<details>` element. Its header shows the title, a count and a one-line summary. The content stays in the page when the fold is closed. Thus find-in-page, anchors and tests still reach it, and the browser does no layout for it.

## What the reader sees first

1. The page header with the title and the actions (ask, compare, export, share, delete). No change.
2. The summary band: the score ring, the verdict, the tier and the panel coverage, then the first three Move first rows. More rows fold behind a "more" line in the band.
3. A section nav. At 768 px and wider it is a row of links that stays at the top of the screen. On a phone it is one "Go to" menu.
4. Findings, open.

## What sits behind a fold, in this order

| Fold                      | Count                                | Summary in the header       | Open by default                 |
| ------------------------- | ------------------------------------ | --------------------------- | ------------------------------- |
| Findings                  | finding cards (6 at most, as before) | status counts               | yes                             |
| Studies                   | studies and images                   | alert count                 | no                              |
| Markers                   | all markers                          | risk and watch counts       | no                              |
| Patterns                  | patterns                             | status counts               | no                              |
| What your report says     | none                                 | the first headline sentence | no                              |
| Follow-ups                | follow-ups                           | the first title             | no                              |
| Questions for your doctor | questions                            | the first question          | no                              |
| Unmeasured                | markers                              | the first names             | no                              |
| Settled                   | lines                                | the first title             | no                              |
| Linked reports            | links                                | none                        | yes, when the report has a link |
| Notes for this visit      | none                                 | the note                    | no                              |

Below the folds, as today: the episode card, the shared links and the other files.

Linked reports opens when a link exists, because MEDI-79 asks for a visible one-line notice with an Undo on both pages.

## Inside the folds

- Studies: one closed card per study. The card header shows the study title, the impression line and a Risk badge when a finding alerts on the study. The card opens to the measurements, the pathology rows, the printed lines and the source line.
- Markers: a filter chip row (All, Risk, Watch, Optimal), then one closed group per system. The group header shows the name, the count and the status counts. One tap opens it. A chip other than All opens every group that has a match.
- Follow-ups, Unmeasured and Questions for your doctor were tabs. Now each is a fold, so the page has one pattern, not two.

## State

- The open or closed state of each fold is kept in `localStorage` under one key for all reports. A stored value wins over the default.
- A link to a hash inside a fold (`#studies`, `#study-<id>`, `#pattern-<key>`, `#findings`, `#move-first`, `#links`) opens every fold around the target, then scrolls to it. Home, Trends and the assistant use these links.

## Not changed

The export page, the share dialog and the shared page. All copy, except the section headers, the "more" line, the "Go to" menu label and the filter chips (All, then the Risk, Watch and Optimal status names) with their empty line.

## Risks

- Speed: the closed folds still render in React, as today, but the browser skips their layout and paint. The report Lighthouse budget (78) must hold on the dense fixture.
- A reader who closed Markers on one report sees it closed on the next. This is the intent of "remember open state".

## After

The after pages are `docs/design/pages/after-report-v3-light-1440.jpg`, `after-report-v3-dark-1440.jpg`, `after-report-v3-light-390.jpg` and `after-report-v3-dark-390.jpg`. They show the 29 Mar 2025 sample report of the demo account with the default folds. The page is 2,766 px high at 1440 px (before: 10,977 px) and 4,220 px high at 390 px (before: 17,805 px).
