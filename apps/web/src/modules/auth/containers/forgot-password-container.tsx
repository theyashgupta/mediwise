import { Link } from "@tanstack/react-router";
import { AuthCard } from "../components/auth-card";
import { EmailForm } from "../components/email-form";
import { useSendResetLink } from "../hooks/use-auth";

export function ForgotPasswordContainer() {
  const send = useSendResetLink();
  const footer = (
    <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
      Go to sign in
    </Link>
  );

  if (send.isSuccess) {
    return (
      <AuthCard
        title="Open the link in your email"
        description={`If an account uses ${send.variables.email}, we sent a link to it. Open the link to set a new password.`}
        footer={footer}
      />
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email. We send you a link to set a new password."
      footer={footer}
    >
      <EmailForm
        submitting={send.isPending}
        error={send.error?.message}
        onSubmit={(values) => send.mutate(values)}
      />
    </AuthCard>
  );
}
