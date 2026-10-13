import type { Ancestry, Relation, Sex } from "@mediwise/shared";

export const relationLabels: Record<Relation, string> = {
  self: "You",
  partner: "Partner",
  parent: "Parent",
  child: "Child",
  sibling: "Sibling",
  other: "Other",
};

export const sexLabels: Record<Sex, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const ancestryLabels: Record<Ancestry, string> = {
  south_asian: "South Asian",
  east_asian: "East Asian",
  european: "European",
  african: "African",
  middle_eastern: "Middle Eastern",
  hispanic: "Hispanic",
  mixed: "Mixed",
  unknown: "Not sure",
};
