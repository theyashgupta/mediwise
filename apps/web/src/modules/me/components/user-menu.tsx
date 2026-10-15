import { Link } from "@tanstack/react-router";
import { LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initial } from "@/common/utils/initial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  account?: string;
  loading: boolean;
  theme?: string;
  signingOut: boolean;
  onThemeChange: (theme: string) => void;
  onSignOut: () => void;
};

export function UserMenu({
  account,
  loading,
  theme,
  signingOut,
  onThemeChange,
  onSignOut,
}: UserMenuProps) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t.me.menu.open}
          data-testid="user-menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-secondary text-sm font-medium uppercase">
              {account ? initial(account) : <User className="size-4" aria-hidden />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-xs text-muted-foreground">{t.me.menu.signedInAs}</span>
          <span className="block truncate font-medium">
            {account ?? (loading ? t.me.menu.loadingAccount : t.me.menu.unavailable)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild data-testid="menu-settings">
          <Link to="/settings">
            <Settings aria-hidden />
            {t.me.menu.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t.me.menu.theme}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={onThemeChange}>
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden />
            {t.me.menu.light}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden />
            {t.me.menu.dark}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor aria-hidden />
            {t.me.menu.system}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onSelect={onSignOut} data-testid="sign-out">
          <LogOut aria-hidden />
          {signingOut ? t.me.menu.signingOut : t.me.menu.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
