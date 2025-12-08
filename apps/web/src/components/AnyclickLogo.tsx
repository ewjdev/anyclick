import Image from "next/image";

interface AnyclickLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  xs: 16,
  sm: 24,
  md: 32,
  lg: 48,
};

export function AnyclickLogo({ size = "md", className }: AnyclickLogoProps) {
  const pixels = sizeMap[size];

  return (
    <Image
      src="/logo.png"
      alt="anyclick"
      width={pixels}
      height={pixels}
      className={className}
      priority={size === "lg"} // Priority for above-fold logos
    />
  );
}
