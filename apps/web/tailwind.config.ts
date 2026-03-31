import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8f4f3",
          100: "#c5e3e1",
          200: "#9ecfcc",
          300: "#72bab6",
          400: "#4eaaa5",
          500: "#2e6964",
          600: "#276059",
          700: "#1d3634",
          800: "#152826",
          900: "#0d1918",
        },
        accent: "#00ffea",
      },
    },
  },
  plugins: [],
};

export default config;
