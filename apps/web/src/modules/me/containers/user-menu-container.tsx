import { type Theme, useTheme } from "@/common/hooks/use-theme";
import { useSession, useSignOut } from "@/modules/auth";
import { UserMenu } from "../components/user-menu";

export function UserMenuContainer() {
  const session = useSession();
  const signOut = useSignOut();
  const { theme, setTheme } = useTheme();
  return (
    <UserMenu
      account={session?.user.email}
      loading={session === undefined}
      theme={theme}
      signingOut={signOut.isPending}
      onThemeChange={(value) => setTheme(value as Theme)}
      onSignOut={() => signOut.mutate()}
    />
  );
}
