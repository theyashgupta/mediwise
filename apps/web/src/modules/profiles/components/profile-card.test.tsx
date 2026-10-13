import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type { Profile } from "../types";
import { ProfileCard } from "./profile-card";

const profile: Profile = {
  id: "profile-1",
  name: "Asha",
  relation: "parent",
  dateOfBirth: "1977-02-28",
  dateOfBirthApproximate: true,
  sex: "female",
  ancestry: "south_asian",
  isSelf: false,
  reportCount: 1,
  valueCount: 42,
};

function render(card: Profile) {
  return renderToStaticMarkup(
    <ProfileCard
      profile={card}
      onEdit={() => {}}
      onRemove={() => {}}
      downloading={false}
      onDownload={() => {}}
    />,
  );
}

test("an approximate date of birth shows the badge and the note", () => {
  const html = render(profile);
  expect(html).toContain("Approximate");
  expect(html).toContain("Enter the exact date.");
});

test("an exact date of birth shows no badge", () => {
  expect(render({ ...profile, dateOfBirthApproximate: false })).not.toContain("Approximate");
});

test("the card shows the CSV button with the row count", () => {
  const html = render(profile);
  expect(html).toContain("Download all values (CSV)");
  expect(html).toContain("42 rows");
});
