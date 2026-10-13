import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { type Theme, useTheme } from "@/common/hooks/use-theme";
import { SecurityContainer, useSignOut } from "@/modules/auth";
import { creditsLeftLabel } from "@/modules/credits";
import { useMe, useMeMutations } from "@/modules/me";
import { ProfileCsvContainer, SelfProfileContainer } from "@/modules/profiles";
import { DataActions } from "../components/data-actions";
import { DeleteAccountDialog } from "../components/delete-account-dialog";
import { NameForm } from "../components/name-form";
import { SettingsSection } from "../components/settings-section";
import { ThemeSelect } from "../components/theme-select";

export function SettingsContainer() {
  const me = useMe();
  const { update, download, remove } = useMeMutations();
  const { theme, setTheme } = useTheme();
  const signOut = useSignOut();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    remove.mutate(undefined, {
      onSuccess: () => {
        setDeleting(false);
        toast.success("We deleted your account.");
        signOut.mutate();
      },
    });
  }

  return (
    <>
      <PageHeader title="Settings" description="Your account and your own profile." />
      <div className="max-w-5xl space-y-8">
        <SettingsSection title="Identity" description="The name shown across MediWise.">
          {me.isPending && <LoadingState variant="card" />}
          {me.isError && (
            <ErrorState message="We could not load your account." onRetry={() => me.refetch()} />
          )}
          {me.data && (
            <NameForm
              key={me.data.name}
              email={me.data.email}
              name={me.data.name}
              submitting={update.isPending}
              error={update.error?.message}
              onSubmit={(input) =>
                update.mutate(input, { onSuccess: () => toast.success("We saved your name.") })
              }
            />
          )}
        </SettingsSection>
        <SettingsSection
          title="Your profile"
          description="Age, sex and ancestry decide which ranges MediWise uses to score your markers."
        >
          <SelfProfileContainer />
        </SettingsSection>
        <SettingsSection
          title="Report credits"
          description="Each report that MediWise reads uses one report credit."
        >
          {me.data && (
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-medium">{creditsLeftLabel(me.data.credits)}</p>
              <Link
                to="/credits"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                How to get more credits
              </Link>
            </div>
          )}
        </SettingsSection>
        <SettingsSection title="Security" description="Your password and how you sign in.">
          <SecurityContainer />
        </SettingsSection>
        <SettingsSection
          title="Appearance"
          description="MediWise saves this choice on this device."
        >
          <ThemeSelect theme={theme} onThemeChange={(value) => setTheme(value as Theme)} />
        </SettingsSection>
        <SettingsSection
          title="Your data"
          description="Download a copy of your profiles, reports and markers, or delete all of it."
        >
          <div className="space-y-6">
            <ProfileCsvContainer />
            <DataActions
              downloading={download.isPending}
              error={download.error?.message}
              onDownload={() => download.mutate()}
              onDelete={() => {
                remove.reset();
                setDeleting(true);
              }}
            />
          </div>
        </SettingsSection>
      </div>
      <DeleteAccountDialog
        open={deleting}
        deleting={remove.isPending}
        error={remove.error?.message}
        onConfirm={confirmDelete}
        onOpenChange={setDeleting}
      />
    </>
  );
}
