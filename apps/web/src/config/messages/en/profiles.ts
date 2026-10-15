import { plural } from "../plural";
import { formatCount } from "../locales";

export const profiles = {
  relation: {
    self: "You",
    partner: "Partner",
    parent: "Parent",
    child: "Child",
    sibling: "Sibling",
    other: "Other",
  },
  sex: { male: "Male", female: "Female", other: "Other" },
  ancestry: {
    south_asian: "South Asian",
    east_asian: "East Asian",
    european: "European",
    african: "African",
    middle_eastern: "Middle Eastern",
    hispanic: "Hispanic",
    mixed: "Mixed",
    unknown: "Not sure",
  },
  approximate: "Approximate",
  approximateBirthNote: "We calculated this date from the age on a report. Enter the exact date.",
  rows: (n: number) =>
    plural("en", n, { one: `${formatCount("en", n)} row`, other: `${formatCount("en", n)} rows` }),
  rowsFor: (rows: string, name: string) => `${rows} for ${name}`,
  saving: "Saving",
  form: {
    name: "Name",
    relation: "Relation to you",
    relationPlaceholder: "Choose a relation",
    dateOfBirth: "Date of birth",
    sex: "Sex",
    sexPlaceholder: "Choose a sex",
    sexHint: "Many lab ranges differ by sex.",
    ancestry: "Ancestry",
    ancestryPlaceholder: "Choose an ancestry",
    ancestryHint:
      "MediWise calibrates some ranges by ancestry, for example blood sugar and cholesterol.",
    permission: "I have this person’s permission to add their reports",
    guardian: "I am this child’s parent or guardian",
    errors: {
      nameMissing: "Enter a name",
      nameTooLong: "Enter a name of 80 characters or fewer",
      relationMissing: "Choose a relation",
      dateOfBirthMissing: "Enter a date of birth",
      dateOfBirthTooEarly: "Enter a date after 1900",
      dateOfBirthFuture: "Date of birth is in the future",
      sexMissing: "Choose a sex",
      ancestryMissing: "Choose an ancestry",
      permissionMissing: "Confirm that you have this person’s permission",
      guardianMissing: "Confirm that you are this child’s parent or guardian",
    },
  },
  sheet: {
    editTitle: "Edit profile",
    addTitle: "Add a family member",
    description: "Age, sex and ancestry decide which ranges MediWise uses to score each marker.",
    save: "Save changes",
    add: "Add profile",
  },
  self: {
    loadError: "We could not load your profile.",
    save: "Save profile",
    saved: "We saved your profile.",
  },
  page: {
    title: "Profiles",
    description: "You and the family members whose reports you manage.",
    add: "Add family member",
    loadError: "We could not load your profiles.",
    emptyTitle: "Only you so far",
    emptyBody: "Add family members to keep their reports and trends separate from yours.",
    limit: (max: number) => `You are at the limit of ${max} profiles.`,
    added: (name: string) => `We added ${name}.`,
    saved: "We saved the profile.",
    removed: (name: string) => `We removed ${name}.`,
  },
  card: {
    years: (n: number) =>
      plural("en", n, {
        one: `${formatCount("en", n)} year`,
        other: `${formatCount("en", n)} years`,
      }),
    dateOfBirthMissing: "Date of birth missing",
    noReports: "No reports",
    reports: (n: number) =>
      plural("en", n, {
        one: `${formatCount("en", n)} report`,
        other: `${formatCount("en", n)} reports`,
      }),
    yearReview: (name: string) => `Year in review for ${name}`,
    edit: (name: string) => `Edit ${name}`,
    remove: (name: string) => `Remove ${name}`,
  },
  csv: {
    preparing: "Preparing file",
    download: "Download all values (CSV)",
  },
  remove: {
    title: (name: string) => `Remove ${name}?`,
    description: "This deletes the profile and every report uploaded for it. You cannot undo this.",
    cancel: "Cancel",
    removing: "Removing",
    confirm: "Remove",
  },
  switcher: {
    label: (name: string) => `Profile: ${name}`,
    viewingFor: "Viewing reports for",
    manage: "Manage profiles",
  },
  consent: {
    title: "Confirm your family profiles",
    bodyBefore:
      "MediWise records the date of each confirmation. If you do not have permission, remove the profile on the",
    bodyLink: "Profiles",
    bodyAfter: "page.",
    permission: (names: string) => `I have the permission of ${names} to add their reports.`,
    guardian: (names: string) => `I am the parent or guardian of ${names}.`,
    confirm: "Confirm",
  },
};
