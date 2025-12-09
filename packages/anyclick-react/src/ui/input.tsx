import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "ac-h-10 ac-w-full ac-rounded-md ac-border ac-border-border ac-bg-surface ac-text-text ac-placeholder-text-muted ac-px-3 ac-py-2 ac-text-sm focus-visible:ac-outline focus-visible:ac-outline-2 focus-visible:ac-outline-offset-2 focus-visible:ac-outline-accent disabled:ac-opacity-50 disabled:ac-cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
