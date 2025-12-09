import React, {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  useState,
} from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ========== Button ==========

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "ac:inline-flex ac:items-center ac:justify-center ac:gap-2 ac:rounded-md ac:font-medium ac:transition-colors focus-visible:ac:outline focus-visible:ac:outline-2 focus-visible:ac:outline-offset-2 focus-visible:ac:outline-accent disabled:ac:opacity-50 disabled:ac:cursor-not-allowed";

    const variants: Record<string, string> = {
      default:
        "ac:bg-accent ac:text-accent-foreground hover:ac:bg-accent/90 ac:border ac:border-transparent",
      ghost: "ac:bg-transparent hover:ac:bg-surface-muted ac:text-text",
      outline:
        "ac:bg-transparent ac:text-text ac:border ac:border-border hover:ac:bg-surface-muted",
      destructive: "ac:bg-destructive ac:text-white hover:ac:bg-destructive/80",
    };

    const sizes: Record<string, string> = {
      sm: "ac:h-8 ac:px-3 ac:text-xs",
      md: "ac:h-9 ac:px-4 ac:text-sm",
      lg: "ac:h-10 ac:px-5 ac:text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// ========== Input ==========

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "ac:h-9 ac:w-full ac:rounded-md ac:border ac:border-border ac:bg-surface ac:text-text ac:placeholder-text-muted ac:px-3 ac:py-2 ac:text-sm focus-visible:ac:outline focus-visible:ac:outline-2 focus-visible:ac:outline-offset-1 focus-visible:ac:outline-accent disabled:ac:opacity-50 disabled:ac:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

// ========== Textarea ==========

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "ac:w-full ac:rounded-md ac:border ac:border-border ac:bg-surface ac:text-text ac:placeholder-text-muted ac:px-3 ac:py-2 ac:text-sm ac:resize-none focus-visible:ac:outline focus-visible:ac:outline-2 focus-visible:ac:outline-offset-1 focus-visible:ac:outline-accent disabled:ac:opacity-50 disabled:ac:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

// ========== Switch ==========

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
}: SwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "ac:relative ac:inline-flex ac:h-5 ac:w-9 ac:shrink-0 ac:cursor-pointer ac:rounded-full ac:border-2 ac:transition-colors focus-visible:ac:outline focus-visible:ac:outline-2 focus-visible:ac:outline-offset-2 focus-visible:ac:outline-accent disabled:ac:cursor-not-allowed disabled:ac:opacity-50",
        checked ? "ac:bg-accent ac:border-green-500/50" : "ac:bg-surface-muted",
        disabled ? "ac:opacity-10 ac:cursor-not-allowed" : "",
      )}
      style={
        !checked
          ? {
              borderColor: "var(--ac-toggle-border)",
            }
          : undefined
      }
    >
      <span
        className={cn(
          "ac:pointer-events-none ac:block ac:h-4 ac:w-4 ac:rounded-full ac:bg-white ac:shadow-lg ac:ring-0 ac:transition-transform",
          checked ? "ac:translate-x-4" : "ac:translate-x-0",
        )}
      />
    </button>
  );
}

// ========== Label ==========

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "ac:text-sm ac:font-medium ac:text-text ac:leading-none",
        className,
      )}
      {...props}
    />
  );
}

// ========== Card ==========

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "ac:rounded-lg ac:border ac:border-border ac:bg-surface-muted ac:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("ac:flex ac:flex-col ac:space-y-1 ac:p-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn(
        "ac:text-sm ac:font-semibold ac:text-text ac:leading-none ac:tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p className={cn("ac:text-xs ac:text-text-muted", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("ac:p-4 ac:pt-0", className)} {...props} />;
}

// ========== Badge ==========

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "destructive";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants: Record<string, string> = {
    default: "ac:bg-border ac:text-text-muted",
    success: "ac:bg-green-500/20 ac:text-green-400",
    warning: "ac:bg-yellow-500/20 ac:text-yellow-400",
    destructive: "ac:bg-destructive/20 ac:text-destructive",
  };

  return (
    <span
      className={cn(
        "ac:inline-flex ac:items-center ac:rounded-full ac:px-2 ac:py-0.5 ac:text-xs ac:font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

// ========== Separator ==========

export function Separator({ className }: { className?: string }) {
  return <div className={cn("ac:h-px ac:w-full ac:bg-border", className)} />;
}

// ========== Alert ==========

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "warning" | "destructive";
};

export function Alert({
  className,
  variant = "default",
  children,
  ...props
}: AlertProps) {
  const variants: Record<string, string> = {
    default: "ac:border-border ac:bg-surface-muted",
    warning: "ac:border-yellow-500/50 ac:bg-yellow-500/10",
    destructive: "ac:border-destructive/50 ac:bg-destructive/10",
  };

  return (
    <div
      role="alert"
      className={cn(
        "ac:rounded-lg ac:border ac:p-3 ac:text-sm",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ========== Tooltip ==========

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Optional click handler for the tooltip content */
  onClick?: () => void;
  /** Position preference: 'left' aligns tooltip to left edge, 'center' centers it (default: 'left' to stay in bounds) */
  position?: "left" | "center";
};

export function Tooltip({
  content,
  children,
  className,
  onClick,
  position = "left",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Keep tooltip visible when hovering over the tooltip content itself
  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  return (
    <div
      className="ac:relative ac:inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="ac:cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          role="tooltip"
          onClick={onClick}
          className={cn(
            "ac:absolute ac:bottom-full ac:mb-2 ac:z-50 ac:px-3 ac:py-2 ac:rounded-md ac:border ac:border-border ac:text-xs ac:text-text ac:shadow-lg ac:whitespace-normal",
            "ac:backdrop-blur-md ac:bg-surface/95",
            "ac:w-[250px] ac:max-w-[calc(380px-2rem)]",
            // Position: left-aligned to stay within popup bounds, or centered
            position === "left"
              ? "ac:left-0"
              : "ac:left-1/2 ac:-translate-x-1/2",
            // Make clickable if onClick is provided
            onClick && "ac:cursor-pointer hover:ac:bg-surface-muted",
            className,
          )}
        >
          {content}
          {/* Arrow - positioned based on tooltip alignment */}
          <div
            className={cn(
              "ac:absolute ac:top-full ac:-mt-px ac:w-0 ac:h-0 ac:border-l-4 ac:border-r-4 ac:border-t-4 ac:border-transparent ac:border-t-border",
              position === "left"
                ? "ac:left-3"
                : "ac:left-1/2 ac:-translate-x-1/2",
            )}
          />
        </div>
      )}
    </div>
  );
}
