import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "ac-bg-accent ac-text-accent-foreground hover:ac-bg-accent-muted ac-border ac-border-border",
  ghost: "ac-bg-transparent hover:ac-bg-surface-muted ac-text-text",
  outline:
    "ac-bg-transparent ac-text-text ac-border ac-border-border hover:ac-bg-surface-muted",
  destructive:
    "ac-bg-destructive ac-text-accent-foreground hover:ac-bg-destructive/80",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "ac-h-8 ac-px-3 ac-text-sm",
  md: "ac-h-10 ac-px-4 ac-text-sm",
  lg: "ac-h-11 ac-px-5 ac-text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "ac-inline-flex ac-items-center ac-justify-center ac-gap-2 ac-rounded-md ac-font-medium ac-transition-colors focus-visible:ac-outline focus-visible:ac-outline-2 focus-visible:ac-outline-offset-2 focus-visible:ac-outline-accent disabled:ac-opacity-50 disabled:ac-cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
