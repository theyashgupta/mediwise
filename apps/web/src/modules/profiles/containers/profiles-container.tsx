import { maxProfilesPerUser, type ProfileInput } from "@mediwise/shared";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "../components/profile-card";
import { ProfileSheet } from "../components/profile-sheet";
import { RemoveProfileDialog } from "../components/remove-profile-dialog";
import { useProfileCsv, useProfileMutations, useProfiles } from "../hooks/use-profiles";
import type { Profile } from "../types";

export function ProfilesContainer() {
  const profiles = useProfiles();
  const { create, update, remove } = useProfileMutations();
  const csv = useProfileCsv();
  const [editing, setEditing] = useState<Profile | "new">();
  const [removing, setRemoving] = useState<Profile>();
  const saving = editing === "new" ? create : update;
  const atLimit = (profiles.data?.length ?? 0) >= maxProfilesPerUser;
  const text = useT().profiles.page;

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
    if (editing === "new") create.mutate(input, { onSuccess: done(text.added(input.name)) });
    else if (editing) update.mutate({ id: editing.id, input }, { onSuccess: done(text.saved) });
  }

  function confirmRemove() {
    if (!removing) return;
    remove.mutate(removing.id, {
      onSuccess: () => {
        toast.success(text.removed(removing.name));
        setRemoving(undefined);
      },
    });
  }

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.description}
        actions={
          profiles.data && (
            <Button onClick={() => openSheet("new")} disabled={atLimit}>
              <Plus aria-hidden />
              {text.add}
            </Button>
          )
        }
      />
      {profiles.isPending && <LoadingState variant="list" />}
      {profiles.isError && (
        <ErrorState message={text.loadError} onRetry={() => profiles.refetch()} />
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
                  downloading={csv.isPending && csv.variables?.id === profile.id}
                  downloadError={csv.variables?.id === profile.id ? csv.error?.message : undefined}
                  onDownload={() => csv.mutate(profile)}
                />
              </li>
            ))}
          </ul>
          {profiles.data.length === 1 && (
            <EmptyState icon={Users} title={text.emptyTitle} body={text.emptyBody} />
          )}
          {atLimit && (
            <p className="text-sm text-muted-foreground">{text.limit(maxProfilesPerUser)}</p>
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
