import type { CSSProperties, ReactNode } from "react";

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
