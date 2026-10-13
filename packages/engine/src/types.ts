import type { Ancestry, Category, Sex, Source } from "./catalog/index.js";

export type EngineProfile = {
  ageYears: number;
  sex: Sex | "other";
  ancestry: Ancestry | "mixed" | "unknown";
};

export type EngineValue = {
  rawName: string;
  panel?: string;
  markerKey?: string;
  value: number | string;
  unit?: string;
  labLow?: number;
  labHigh?: number;
};

export type EngineInput = { profile: EngineProfile; values: EngineValue[] };

export type MarkerStatus = "optimal" | "watch" | "risk" | "unknown";

export type CalibratedRange = {
  optimalLow: number | null;
  optimalHigh: number | null;
  watchLow: number | null;
  watchHigh: number | null;
  source: string;
};

export type LabRange = { low: number | null; high: number | null };

export type MarkerResult = {
  markerKey: string;
  value: number | string;
  unit: string;
  status: MarkerStatus;
  calibrated: CalibratedRange | null;
  labRange?: LabRange;
  deviation: number;
};

export type DerivedResult = MarkerResult & { inputs: string[] };

export type UnmappedValue = { rawName: string; value: number | string; unit: string };

export type Tier = "apex" | "platinum" | "gold" | "silver" | "bronze";

export type Coverage = { measured: number; core: number; pct: number };

export type Score = {
  overall: number;
  byCategory: Record<Category, number | null>;
  coverage: Coverage;
  capped: boolean;
  tier: Tier;
  formula: string;
};

export type MoveFirst = {
  markerKey: string;
  severity: "critical" | "out_of_optimal";
  reason: string;
};

export type FollowUpKind = "retest" | "supplement" | "measure";

export type FollowUp = {
  kind: FollowUpKind;
  markerKey: string;
  title: string;
  why: string;
  next: string;
  rank: number;
};

export type Unmeasured = { markerKey: string; name: string; description: string };

export type PatternBand = "risk_low" | "watch_low" | "optimal" | "watch_high" | "risk_high";

export type PatternCondition = { markerKey: string; required?: boolean } & (
  | { comparator: "status_is"; threshold: PatternBand[] }
  | { comparator: "value_above" | "value_below"; threshold: number }
  | { comparator: "ratio_above"; denominatorKey: string; threshold: number }
  | { comparator: "measured" }
);

export type PatternStudy = { id: string; kind: string; impression: string | null };

export type Pattern = {
  key: string;
  name: string;
  description: string;
  conditions: PatternCondition[];
  minMatches: number;
  study?: { kinds: string[]; says: string };
  severity: "watch" | "risk";
  whatItSuggests: string;
  whatToDo: string;
  askDoctor: string[];
  sources: Source[];
};

export type MatchedCondition = {
  markerKey: string;
  name: string;
  value: number | string;
  unit: string;
};

export type PatternMatch = Omit<Pattern, "conditions" | "minMatches" | "study"> & {
  matched: MatchedCondition[];
  studyIds?: string[];
};

export type EngineOutput = {
  markers: MarkerResult[];
  derived: DerivedResult[];
  unmapped: UnmappedValue[];
  score: Score;
  verdict: string;
  moveFirst: MoveFirst[];
  followUps: FollowUp[];
  unmeasured: Unmeasured[];
  patterns: PatternMatch[];
  doctorQuestions: string[];
};

type StoredStatus = Exclude<MarkerStatus, "unknown"> | null;

export type VisitMarker = {
  markerKey: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  status: StoredStatus;
  calibratedLow: number | null;
  calibratedHigh: number | null;
};

export type VisitStudy = PatternStudy & {
  bodyRegion: string | null;
  performedAt?: string | null;
  result?: string | null;
  measurements: { key: string; value: number | null; unit: string | null; status: StoredStatus }[];
};

export type Visit = {
  date: string;
  labName: string | null;
  markers: VisitMarker[];
  studies: VisitStudy[];
};

export type FindingKind = "study_alert" | "change" | "link" | "study" | "risk" | "good_news";

export type FindingSeverity = Exclude<MarkerStatus, "unknown">;

export type TrendDirection = "improving" | "worsening" | "stable";

export type LaterVisit = Visit & { reportId: string; linked: boolean };

export type Settlement = {
  state: "settled" | "confirmed";
  reportId: string;
  date: string;
  earlierDate: string;
  labName: string | null;
  earlier: string;
  later: string;
  subject: string;
  alertKeys: string[];
  markerKey?: string;
  severity?: FindingSeverity;
};

export type FindingDraft = {
  kind: FindingKind;
  severity: FindingSeverity;
  direction?: TrendDirection;
  title: string;
  citedKeys: string[];
  citedStudyIds: string[];
  rank: number;
  facts: string[];
  fallback?: string;
  note?: string;
  askDoctor?: string;
  settlement?: Settlement;
};
