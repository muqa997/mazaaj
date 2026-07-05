import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // تُبنى من متغيرات CSS بـ globals.css فتنقلب تلقائياً مع الوضع الداكن
        background: "rgb(var(--color-background) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "var(--font-cairo)",
          "var(--font-alexandria)",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgb(var(--color-primary) / 0.10)",
        "glass-lg": "0 20px 50px -10px rgb(var(--color-primary) / 0.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
