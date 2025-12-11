import type { Config } from "tailwindcss";

// Shared Tailwind v4 config for Anyclick surfaces (extension + react).
// Key isolation settings:
// - prefix all utility classes to avoid leaking into host sites.
// - disable preflight to avoid global resets.
// - rely on CSS variables under [data-anyclick-root] for theming.
const config: Config = {
  prefix: "ac-",
  corePlugins: {
    preflight: false,
  },
  content: [
    "./packages/anyclick-react/src/**/*.{ts,tsx}",
    "./packages/anyclick-extension/src/**/*.{ts,tsx,html}",
    "./packages/anyclick-extension/static/**/*.{html,css}",
  ],
  theme: {
    extend: {
      colors: {
        // These map to CSS vars defined under [data-anyclick-root]
        surface: "var(--ac-surface)",
        surfaceMuted: "var(--ac-surface-muted)",
        border: "var(--ac-border)",
        accent: "var(--ac-accent)",
        accentMuted: "var(--ac-accent-muted)",
        accentForeground: "var(--ac-accent-foreground)",
        text: "var(--ac-text)",
        textMuted: "var(--ac-text-muted)",
        destructive: "var(--ac-destructive)",
      },
      borderRadius: {
        md: "var(--ac-radius-md)",
        lg: "var(--ac-radius-lg)",
        full: "var(--ac-radius-full)",
      },
      spacing: {
        "menu-gap": "var(--ac-gap)",
        "menu-pad": "var(--ac-pad)",
      },
      boxShadow: {
        menu: "var(--ac-shadow-menu)",
      },
    },
  },
};

export default config;
