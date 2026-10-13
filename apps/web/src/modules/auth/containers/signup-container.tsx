import { Link, useNavigate } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { AuthCard } from "../components/auth-card";
import { CredentialsForm } from "../components/credentials-form";
import { GoogleButton } from "../components/google-button";
import { useGoogleSignIn, useSignUp } from "../hooks/use-auth";

export function SignupContainer() {
  const t = useT();
  const signUp = useSignUp();
  const google = useGoogleSignIn();
  const navigate = useNavigate();

  if (signUp.isSuccess && !signUp.data.data.session) {
    return (
      <AuthCard
        title={t.auth.signup.confirmTitle}
        description={t.auth.signup.confirmDescription(signUp.variables.email)}
        footer={
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t.auth.goToSignIn}
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      title={t.auth.signup.title}
      description={t.auth.signup.description}
      footer={
        <p>
          {t.auth.signup.haveAccount}{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t.auth.signup.signIn}
          </Link>
        </p>
      }
    >
      <GoogleButton
        pending={google.isPending}
        error={google.error?.message}
        onClick={() => google.mutate()}
      />
      <CredentialsForm
        mode="sign-up"
        submitting={signUp.isPending}
        error={signUp.error?.message}
        onSubmit={(values) =>
          signUp.mutate(values, {
            onSuccess: ({ data }) => {
              if (data.session) void navigate({ to: "/" });
            },
          })
        }
      />
    </AuthCard>
  );
}
