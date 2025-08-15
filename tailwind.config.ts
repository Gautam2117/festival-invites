import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-hind)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0B0F19",
          700: "#1F2937",
          500: "#374151",
        },
        brand: {
          600: "#2563EB",
          700: "#1D4ED8",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
