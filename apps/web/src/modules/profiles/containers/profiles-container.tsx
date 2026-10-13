import { maxProfilesPerUser, type ProfileInput } from "@mediwise/shared";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "../components/profile-card";
import { ProfileSheet } from "../components/profile-sheet";
import { RemoveProfileDialog } from "../components/remove-profile-dialog";
import { useProfileMutations, useProfiles } from "../hooks/use-profiles";
import type { Profile } from "../types";

export function ProfilesContainer() {
  const profiles = useProfiles();
  const { create, update, remove } = useProfileMutations();
  const [editing, setEditing] = useState<Profile | "new">();
  const [removing, setRemoving] = useState<Profile>();
  const saving = editing === "new" ? create : update;
  const atLimit = (profiles.data?.length ?? 0) >= maxProfilesPerUser;

  function openSheet(target: Profile | "new") {
    create.reset();
    update.reset();
    setEditing(target);
  }

  function save(input: ProfileInput) {
    const done = (message: string) => () => {
      toast.success(message);
      setEditing(undefined);
    };
    if (editing === "new") create.mutate(input, { onSuccess: done(`We added ${input.name}.`) });
    else if (editing)
      update.mutate({ id: editing.id, input }, { onSuccess: done("We saved the profile.") });
  }

  function confirmRemove() {
    if (!removing) return;
    remove.mutate(removing.id, {
      onSuccess: () => {
        toast.success(`We removed ${removing.name}.`);
        setRemoving(undefined);
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Profiles"
        description="You and the family members whose reports you manage."
        actions={
          profiles.data && (
            <Button onClick={() => openSheet("new")} disabled={atLimit}>
              <Plus aria-hidden />
              Add family member
            </Button>
          )
        }
      />
      {profiles.isPending && <LoadingState variant="list" />}
      {profiles.isError && (
        <ErrorState message="We could not load your profiles." onRetry={() => profiles.refetch()} />
      )}
      {profiles.data && (
        <div className="space-y-6">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {profiles.data.map((profile) => (
              <li key={profile.id}>
                <ProfileCard
                  profile={profile}
                  onEdit={() => openSheet(profile)}
                  onRemove={() => {
                    remove.reset();
                    setRemoving(profile);
                  }}
                />
              </li>
            ))}
          </ul>
          {profiles.data.length === 1 && (
            <EmptyState
              icon={Users}
              title="Only you so far"
              body="Add family members to keep their reports and trends separate from yours."
            />
          )}
          {atLimit && (
            <p className="text-sm text-muted-foreground">
              You are at the limit of {maxProfilesPerUser} profiles.
            </p>
          )}
        </div>
      )}
      <ProfileSheet
        open={editing !== undefined}
        profile={editing === "new" ? undefined : editing}
        submitting={saving.isPending}
        error={saving.error?.message}
        onOpenChange={(open) => !open && setEditing(undefined)}
        onSubmit={save}
      />
      <RemoveProfileDialog
        name={removing?.name}
        removing={remove.isPending}
        error={remove.error?.message}
        onConfirm={confirmRemove}
        onOpenChange={(open) => !open && setRemoving(undefined)}
      />
    </>
  );
}
