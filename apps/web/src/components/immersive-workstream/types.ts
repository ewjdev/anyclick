import type { CSSProperties, ReactNode } from "react";
import type { ContextMenuItem } from "@ewjdev/anyclick-react";

export interface ImmersiveTheme {
  id: string;
  title: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  mode: "light" | "dark";
  backgroundGradient: string;
  gridPattern?: string;
  backgroundImage?: string;
  floatingElements: FloatingElement[];
  cardContent: ReactNode;
  menuItems: ContextMenuItem[];
  menuStyle: CSSProperties;
  pointerIcon: ReactNode;
}

export interface FloatingElement {
  icon: ReactNode;
  position: { x: string; y: string };
  parallaxMultiplier: number;
  size: number;
  opacity: number;
  rotation?: number;
}
