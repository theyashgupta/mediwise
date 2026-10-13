import type { ProfileInput } from "@mediwise/shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Profile } from "../types";
import { ProfileForm } from "./profile-form";

type ProfileSheetProps = {
  open: boolean;
  profile?: Profile;
  submitting: boolean;
  error?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProfileInput) => void;
};

export function ProfileSheet({
  open,
  profile,
  submitting,
  error,
  onOpenChange,
  onSubmit,
}: ProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{profile ? "Edit profile" : "Add a family member"}</SheetTitle>
          <SheetDescription>
            Age, sex and ancestry decide which ranges MediWise uses to score each marker.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ProfileForm
            key={profile?.id ?? "new"}
            defaultValues={
              profile && {
                name: profile.name,
                relation: profile.relation,
                dateOfBirth: profile.dateOfBirth ?? "",
                sex: profile.sex ?? undefined,
                ancestry: profile.ancestry,
              }
            }
            isSelf={profile?.isSelf ?? false}
            submitLabel={profile ? "Save changes" : "Add profile"}
            submitting={submitting}
            error={error}
            onSubmit={onSubmit}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
