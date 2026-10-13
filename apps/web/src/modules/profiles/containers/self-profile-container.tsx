import { toast } from "sonner";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { ProfileForm } from "../components/profile-form";
import { useProfileMutations, useProfiles } from "../hooks/use-profiles";

export function SelfProfileContainer() {
  const profiles = useProfiles();
  const { update } = useProfileMutations();
  const self = profiles.data?.find((profile) => profile.isSelf);
  const text = useT().profiles.self;

  if (profiles.isPending) return <LoadingState variant="card" />;
  if (!self) {
    return <ErrorState message={text.loadError} onRetry={() => profiles.refetch()} />;
  }
  return (
    <ProfileForm
      key={self.id}
      defaultValues={{
        name: self.name,
        dateOfBirth: self.dateOfBirth ?? "",
        sex: self.sex ?? undefined,
        ancestry: self.ancestry,
      }}
      isSelf
      approximateBirth={self.dateOfBirthApproximate}
      hideName
      submitLabel={text.save}
      submitting={update.isPending}
      error={update.error?.message}
      onSubmit={({ dateOfBirth, sex, ancestry }) =>
        update.mutate(
          { id: self.id, input: { dateOfBirth, sex, ancestry } },
          { onSuccess: () => toast.success(text.saved) },
        )
      }
    />
  );
}
