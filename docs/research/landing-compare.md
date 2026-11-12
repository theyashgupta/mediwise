# Landing Compare section: comparison table patterns (MEDI-189)

Looked at: Linear, Vercel and Notion pricing compare tables, the shadcn Table, Stripe pricing (no compare table). Tailwind Plus is behind a login and was not checked. The fetch saw page text only, not markup.

1. Shared: a feature name in the first column, one column per option, one row per feature.
2. Shared: every value is written as words ("Included", "Not included", a limit). No cell is an icon alone.
3. Shared: one option is called out (Notion labels Business "Recommended"). A tint or a border on that column is the usual way.
4. Borrow: a real `<table>` with a `<caption>`, `<th scope="col">` and `<th scope="row">` (the shadcn Table markup).
5. Borrow: an icon next to the short text, never instead of it. The icon has a label ("Yes", "No"), so colour is not the only signal.
6. Borrow: tint and border the MediWise column, as the old MediWise card did.
7. Skip: sticky headers and section groups. Six rows do not need them.
8. Mobile options: stack per option (two cards) or stack per row. Per option makes the reader jump between cards to compare one feature.
9. Picked: one table, stacked per row below 768 px. The feature is the heading, the lab PDF value comes first, the tinted MediWise value last.
10. CSS only: the table cells change to `display: block` below 768 px. Explicit ARIA table roles keep the table semantics that some browsers drop when the display changes.
