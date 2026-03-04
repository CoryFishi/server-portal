import type { Config } from "tailwindcss";

export default {
  // In Tailwind v4, colors are registered via --color-* variables in @layer theme in App.css.
  // No color config is needed here — bg-background-50, text-text-900, etc. all work automatically.
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [],
} satisfies Config;
