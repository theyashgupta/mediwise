import type { ReactNode } from "react";
import { GlassCard } from "@/common/components/surface/glass";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <GlassCard>
      <CardHeader className="gap-2">
        <CardTitle>
          <h1 className="font-display text-display font-normal text-balance">{title}</h1>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent className="gap-6">{children}</CardContent>}
      {footer && (
        <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>
      )}
    </GlassCard>
  );
}
