import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { AuthCard } from "../components/auth-card";
import { EmailForm } from "../components/email-form";
import { useSendResetLink } from "../hooks/use-auth";

export function ForgotPasswordContainer() {
  const t = useT();
  const send = useSendResetLink();
  const footer = (
    <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
      {t.auth.goToSignIn}
    </Link>
  );

  if (send.isSuccess) {
    return (
      <AuthCard
        title={t.auth.forgot.sentTitle}
        description={t.auth.forgot.sentDescription(send.variables.email)}
        footer={footer}
      />
    );
  }

  return (
    <AuthCard title={t.auth.forgot.title} description={t.auth.forgot.description} footer={footer}>
      <EmailForm
        submitting={send.isPending}
        error={send.error?.message}
        onSubmit={(values) => send.mutate(values)}
      />
    </AuthCard>
  );
}
