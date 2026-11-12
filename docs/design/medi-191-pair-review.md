# Pair review, MEDI-191 (before-medi-191-* vs after-medi-191-*)

Method: every page at 1280 and 390 px, light and dark (100 pairs). Metrics per pair: full-page height change and changed pixels in the top screen (1100 px at 1280, 1500 px at 390). Every page with more than 1% changed pixels was viewed side by side (top screen, all 4 pairs). Live checks for controls below the top screen: the report Episode row (one line again), the settings selects, the dialogs and menus.

| Page | light 1280 | light 390 | dark 1280 | dark 390 | Verdict |
| - | - | - | - | - | - |
| admin | h+0.0% px0.2% | h+0.0% px0.4% | h+0.0% px0.2% | h+0.0% px0.4% | PASS, unchanged (demo account sees the not-admin state). |
| ask | h+0.0% px0% | h+0.0% px0.1% | h+0.0% px0% | h+0.0% px0.1% | PASS, unchanged at the top. |
| compare | h+0.3% px10.9% | h+0.4% px16.7% | h+0.3% px9.2% | h+0.4% px12.7% | PASS. Report A and B selects are the layer Select (40 px, 12 px corners); table unchanged. |
| contact | h+0.0% px0% | h+0.0% px0% | h+0.0% px0% | h+0.0% px0% | PASS, unchanged. |
| credits | h+0.0% px1.8% | h+1.1% px7.3% | h+0.0% px1.8% | h+1.1% px6.8% | PASS. Pack cards 16 px, Buy buttons 40 px; layout unchanged. |
| design | h+49.8% px9.9% | h+60.0% px13.4% | h+49.8% px9.9% | h+60.0% px13.6% | PASS, expected growth: the gallery gained the Controls panel (PRD-1). |
| export | h+0.1% px9.1% | h+0.0% px16.9% | h+0.1% px9.1% | h+0.0% px16.9% | PASS. Same layout; header icon buttons on the layer. |
| forgot-password | h+0.0% px2.7% | h+0.0% px6.8% | h+0.0% px2.4% | h+0.0% px6% | PASS. Field 40 px with the 3:1 edge. |
| home | h-0.3% px0.6% | h-0.7% px13.6% | h-0.3% px0.6% | h-0.7% px12.5% | PASS. Same layout; greeting text differs by time of day; cards 16 px. |
| kitchen-sink | h+1.0% px0.2% | h-0.5% px0.2% | h+1.0% px0.2% | h-0.5% px0.3% | PASS, dev page; the "Extra small" demo button removed. |
| login | h+4.2% px4.2% | h+3.9% px11.3% | h+4.2% px3.7% | h+3.9% px10.1% | PASS. Inputs 40 px with the 3:1 edge, layer Sign in button, language Select. |
| marker | h+0.0% px0% | h+0.0% px0.1% | h+0.0% px0% | h+0.0% px0% | PASS after a retake (the first after shot at 390 light caught a loading skeleton). |
| privacy | h+16.6% px10.6% | h+17.8% px20.3% | h+16.6% px10.1% | h+17.8% px19.7% | PASS. Height change is MEDI-190 content (new "Who this policy covers" section) merged from main, not this branch. |
| profiles | h+0.0% px0.6% | h+0.0% px6% | h+0.0% px0.5% | h+0.0% px5.5% | PASS. Edit and Remove are IconButtons (44 px on a phone, 40 px from md); at 390 the Meera subtitle wraps one word earlier. |
| refunds | h+0.0% px0% | h+0.0% px0% | h+0.0% px0% | h+0.0% px0% | PASS, unchanged. |
| report | h+1.6% px7.2% | h+0.6% px1.1% | h+1.6% px6.5% | h+0.6% px0.9% | PASS with one accepted change: at 1280 "Rename" wraps under the long title because the 4 header IconActions are 40 px (were 36); MEDI-177 lets header rows wrap. Episode row fixed (Field w-auto) and back on one line. |
| reports | h+0.0% px0.2% | h+0.0% px0.1% | h+0.0% px0.2% | h+0.0% px0.1% | PASS, unchanged at the top. |
| reset-password | h+0.0% px0% | h+0.0% px0% | h+0.0% px0% | h+0.0% px0% | PASS, unchanged. |
| settings | h+3.5% px4.7% | h+2.6% px12.3% | h+3.5% px4% | h+2.6% px11.3% | PASS. Inputs and selects on the layer, 40 px; sections unchanged. |
| signup | h+1.8% px5% | h+1.8% px12.5% | h+1.8% px4.6% | h+1.8% px11.3% | PASS. Same as login. |
| terms | h+4.4% px6.9% | h+6.1% px14.9% | h+4.4% px6.5% | h+6.1% px14.5% | PASS. Height change is MEDI-190 content (worldwide terms) merged from main. |
| trend | h+0.0% px0.1% | h+0.3% px5.3% | h+0.0% px0.1% | h+0.3% px4.8% | PASS. Same layout, chart range buttons on the layer. |
| trends | h+0.0% px0.7% | h+0.0% px7.7% | h+0.0% px0.6% | h+0.0% px7.4% | PASS. Filter buttons on the layer; same layout. |
| upload | h+0.0% px0.1% | h+0.0% px0.3% | h+0.0% px0.1% | h+0.0% px0.3% | PASS, unchanged at the top. |
| year-review | h+0.0% px0.1% | h+0.2% px9.5% | h+0.0% px0.1% | h+0.2% px9.1% | PASS. Same layout; buttons on the layer. |

Skipped pages: share (needs a share token, the sweep never creates one), episode (the demo profile has no episode). No pair shows a lost element, a broken layout or sideways scroll.
