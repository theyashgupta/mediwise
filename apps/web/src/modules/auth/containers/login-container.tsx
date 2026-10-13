import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AuthCard } from "../components/auth-card";
import { CredentialsForm } from "../components/credentials-form";
import { GoogleButton } from "../components/google-button";
import { safeNext } from "../config/callback";
import { authErrorMessage } from "../config/messages";
import { useGoogleSignIn, useSignIn } from "../hooks/use-auth";

export function LoginContainer() {
  const search = useSearch({ from: "/_auth/login" });
  const next = safeNext(search.next, window.location.origin);
  const signIn = useSignIn();
  const google = useGoogleSignIn(next);
  const navigate = useNavigate();

  return (
    <AuthCard
      title="Sign in"
      description="Sign in to see your reports."
      footer={
        <p>
          No account?{" "}
          <Link
            to="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <GoogleButton
        pending={google.isPending}
        error={google.error?.message ?? (search.error && authErrorMessage({ code: search.error }))}
        onClick={() => google.mutate()}
      />
      <CredentialsForm
        mode="sign-in"
        submitting={signIn.isPending}
        error={signIn.error?.message}
        onSubmit={(values) => signIn.mutate(values, { onSuccess: () => navigate({ href: next }) })}
      />
    </AuthCard>
  );
}
