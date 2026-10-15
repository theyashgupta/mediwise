import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/common/components/error-state";
import { LanguageSelect } from "@/common/components/language-select";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { type Theme, useTheme } from "@/common/hooks/use-theme";
import { SecurityContainer, useSignOut } from "@/modules/auth";
import { creditsLeftLabel } from "@/modules/credits";
import { useMe, useMeMutations } from "@/modules/me";
import { contact } from "@/modules/payments";
import { ProfileCsvContainer, SelfProfileContainer } from "@/modules/profiles";
import { AboutDetails } from "../components/about-details";
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
  const t = useT();
  const copy = t.settings;

  function confirmDelete() {
    remove.mutate(undefined, {
      onSuccess: () => {
        setDeleting(false);
        toast.success(copy.accountDeleted);
        signOut.mutate();
      },
    });
  }

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <div className="max-w-5xl space-y-8">
        <SettingsSection title={copy.identity.title} description={copy.identity.description}>
          {me.isPending && <LoadingState variant="card" />}
          {me.isError && <ErrorState message={copy.loadError} onRetry={() => me.refetch()} />}
          {me.data && (
            <NameForm
              key={me.data.name}
              email={me.data.email}
              name={me.data.name}
              submitting={update.isPending}
              error={update.error?.message}
              onSubmit={(input) =>
                update.mutate(input, { onSuccess: () => toast.success(copy.nameSaved) })
              }
            />
          )}
        </SettingsSection>
        <SettingsSection title={copy.profile.title} description={copy.profile.description}>
          <SelfProfileContainer />
        </SettingsSection>
        <SettingsSection title={copy.credits.title} description={copy.credits.description}>
          {me.data && (
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-medium">{creditsLeftLabel(me.data.credits)}</p>
              <Link
                to="/credits"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {copy.credits.more}
              </Link>
            </div>
          )}
        </SettingsSection>
        <SettingsSection title={copy.security.title} description={copy.security.description}>
          <SecurityContainer />
        </SettingsSection>
        <SettingsSection title={copy.appearance.title} description={copy.appearance.description}>
          <ThemeSelect theme={theme} onThemeChange={(value) => setTheme(value as Theme)} />
        </SettingsSection>
        <SettingsSection title={copy.language.title} description={copy.language.description}>
          <LanguageSelect />
        </SettingsSection>
        <SettingsSection title={copy.data.title} description={copy.data.description}>
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
        <SettingsSection
          title={copy.about.title}
          description={copy.about.description(contact.businessName)}
        >
          <AboutDetails />
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
