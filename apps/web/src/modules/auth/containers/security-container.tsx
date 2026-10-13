import { toast } from "sonner";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { Separator } from "@/components/ui/separator";
import { PasswordForm } from "../components/password-form";
import { useUpdatePassword } from "../hooks/use-auth";
import { useSession } from "../hooks/use-session";

export function SecurityContainer() {
  const t = useT();
  const session = useSession();
  const update = useUpdatePassword();

  if (!session) return <LoadingState variant="card" />;

  const googleLinked = session.user.identities?.some((identity) => identity.provider === "google");

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="font-medium">{t.auth.security.changePassword}</h3>
        <PasswordForm
          key={update.isSuccess ? update.submittedAt : 0}
          submitting={update.isPending}
          error={update.error?.message}
          onSubmit={({ password }) =>
            update.mutate(password, { onSuccess: () => toast.success(t.auth.passwordChanged) })
          }
        />
      </section>
      <Separator />
      <section className="space-y-1">
        <h3 className="font-medium">{t.auth.security.google}</h3>
        <p className="text-sm text-muted-foreground">
          {googleLinked ? t.auth.security.googleLinked : t.auth.security.googleNotLinked}
        </p>
      </section>
    </div>
  );
}
