import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { AnyclickButton } from "../styling";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", ...props }, ref) => {
    const tone =
      variant === "default"
        ? "accent"
        : variant === "destructive"
          ? "danger"
          : "neutral";

    return (
      <AnyclickButton
        ref={ref}
        slotName="shared.button"
        slotState={{ size, tone }}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
