import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00E701",
        bgMain: "#0F212E",
        bgSec: "#1A2C38",
        cardHover: "#253B49",
        inputBg: "#0F212E",
        borderCol: "#2F4553",
        textMain: "#FFFFFF",
        textSec: "#B1BAD3",
        danger: "#ED4163",
        disabled: "#2F4553",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "Arial", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
