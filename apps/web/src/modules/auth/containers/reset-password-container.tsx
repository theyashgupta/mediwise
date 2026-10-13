import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { LoadingState } from "@/common/components/loading-state";
import { AuthCard } from "../components/auth-card";
import { PasswordForm } from "../components/password-form";
import { useUpdatePassword } from "../hooks/use-auth";
import { useSession } from "../hooks/use-session";

export function ResetPasswordContainer() {
  const session = useSession();
  const update = useUpdatePassword();
  const navigate = useNavigate();

  if (session === undefined) return <LoadingState variant="card" />;

  if (!session) {
    return (
      <AuthCard
        title="This link does not work"
        description="The link is not valid or it expired. Ask for a new link."
        footer={
          <Link
            to="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Send a new link
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard title="Set a new password" description={`For ${session.user.email}.`}>
      <PasswordForm
        fullWidth
        submitting={update.isPending}
        error={update.error?.message}
        onSubmit={({ password }) =>
          update.mutate(password, {
            onSuccess: () => {
              toast.success("We changed your password.");
              void navigate({ to: "/" });
            },
          })
        }
      />
    </AuthCard>
  );
}
