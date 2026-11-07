import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00e701",     // Neon Green
        bgMain: "#07110f",      // Main Dark Green/Black Background
        bgSec: "#111d19",       // Panel/Card Background
        cardHover: "#192923",   // Hover state for cards
        borderCol: "#26352e",   // Borders
        textMain: "#f5f7f6",    // Main Text
        textSec: "#9ca9a3",     // Muted/Secondary Text
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Arial", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
