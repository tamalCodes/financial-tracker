import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heading)", "Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
