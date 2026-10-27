import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Tema "Zefflow": Obsidian Dark ElevenLabs + aksen violet.
 * Semua warna lewat CSS variable (lihat globals.css) agar light/dark
 * cukup mengganti variable, tanpa `dark:` di tiap komponen.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          sunken: "hsl(var(--surface-sunken))",
        },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
      },
      boxShadow: {
        // Bayangan berlapis & sangat halus, bukan shadow-md bawaan
        soft: "0 1px 2px hsl(var(--shadow) / 0.04), 0 4px 12px -2px hsl(var(--shadow) / 0.06)",
        lift: "0 2px 4px hsl(var(--shadow) / 0.04), 0 12px 32px -8px hsl(var(--shadow) / 0.14)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.35), 0 8px 28px -6px hsl(var(--primary) / 0.45)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand-from)) 0%, hsl(var(--brand-to)) 100%)",
        "grain-fade":
          "radial-gradient(60% 50% at 50% 0%, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: { to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 2s linear infinite",
      },
      transitionTimingFunction: { spring: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [animate],
};

export default config;
