import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { AuthCard } from "../components/auth-card";
import { PasswordForm } from "../components/password-form";
import { useUpdatePassword } from "../hooks/use-auth";
import { useSession } from "../hooks/use-session";

export function ResetPasswordContainer() {
  const t = useT();
  const session = useSession();
  const update = useUpdatePassword();
  const navigate = useNavigate();

  if (session === undefined) return <LoadingState variant="card" />;

  if (!session) {
    return (
      <AuthCard
        title={t.auth.reset.invalidTitle}
        description={t.auth.reset.invalidDescription}
        footer={
          <Link
            to="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t.auth.reset.sendNewLink}
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      title={t.auth.reset.title}
      description={t.auth.reset.forEmail(session.user.email ?? "")}
    >
      <PasswordForm
        fullWidth
        submitting={update.isPending}
        error={update.error?.message}
        onSubmit={({ password }) =>
          update.mutate(password, {
            onSuccess: () => {
              toast.success(t.auth.passwordChanged);
              void navigate({ to: "/" });
            },
          })
        }
      />
    </AuthCard>
  );
}
