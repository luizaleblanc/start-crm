import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        success: "var(--success)",
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        midnight: "var(--color-midnight)",
      },
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        h1: ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        h3: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        h4: ["1.375rem", { lineHeight: "1.25", fontWeight: "600" }],
        h5: ["1.125rem", { lineHeight: "1.3", fontWeight: "600" }],
        h6: ["0.8125rem", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "700" }],
        body: ["0.9375rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.3", fontWeight: "400" }],
      },
      borderRadius: {
        sm: "3px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
