import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

const squares = {
  sm: "size-11 px-0 md:size-8",
  md: "size-11 px-0 md:size-10",
} as const;

type IconButtonProps = Omit<ButtonProps, "size" | "aria-label"> & {
  label: string;
  size?: keyof typeof squares;
};

export function IconButton({
  label,
  size = "md",
  variant = "ghost",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          aria-label={label}
          className={cn(squares[size], className)}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
