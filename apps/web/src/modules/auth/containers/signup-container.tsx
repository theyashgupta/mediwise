import { Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "../components/auth-card";
import { CredentialsForm } from "../components/credentials-form";
import { GoogleButton } from "../components/google-button";
import { useGoogleSignIn, useSignUp } from "../hooks/use-auth";

export function SignupContainer() {
  const signUp = useSignUp();
  const google = useGoogleSignIn();
  const navigate = useNavigate();

  if (signUp.isSuccess && !signUp.data.data.session) {
    return (
      <AuthCard
        title="Confirm your email"
        description={`We sent a link to ${signUp.variables.email}. Open the link to confirm your account.`}
        footer={
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Go to sign in
          </Link>
        }
      />
    );
  }

  return (
    <AuthCard
      title="Create an account"
      description="Upload your reports and see every marker explained."
      footer={
        <p>
          Have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
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
