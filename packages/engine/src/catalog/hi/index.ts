import { bloodCountText } from "./blood-count.js";
import { boneText } from "./bone.js";
import { cardiacText } from "./cardiac.js";
import { derivedText } from "./derived.js";
import { electrolytesText } from "./electrolytes.js";
import { hormonesText } from "./hormones.js";
import { inflammationText } from "./inflammation.js";
import { ironText } from "./iron.js";
import { kidneyText } from "./kidney.js";
import { lipidsText } from "./lipids.js";
import { liverText } from "./liver.js";
import { metabolicText } from "./metabolic.js";
import { otherText } from "./other.js";
import { studiesText } from "./studies.js";
import { thyroidText } from "./thyroid.js";
import { urateText } from "./urate.js";
import { urineText } from "./urine.js";
import { vitalsText } from "./vitals.js";
import { vitaminsText } from "./vitamins.js";
import type { MarkerText } from "../text.js";

export { patternText as hindiPatternText } from "./patterns.js";

export const hindiGroups: Record<string, Record<string, MarkerText>> = {
  "blood-count": bloodCountText,
  bone: boneText,
  cardiac: cardiacText,
  derived: derivedText,
  electrolytes: electrolytesText,
  hormones: hormonesText,
  inflammation: inflammationText,
  iron: ironText,
  kidney: kidneyText,
  lipids: lipidsText,
  liver: liverText,
  metabolic: metabolicText,
  other: otherText,
  studies: studiesText,
  thyroid: thyroidText,
  urate: urateText,
  urine: urineText,
  vitals: vitalsText,
  vitamins: vitaminsText,
};

export const hindiMarkerText: Record<string, MarkerText> = Object.assign(
  {},
  ...Object.values(hindiGroups),
);
