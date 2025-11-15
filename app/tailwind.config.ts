/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        space: {
          900: "#030414",
          950: "#01020a",
        },
        aurora: {
          teal: "#2CFACB",
          lime: "#9EFF6C",
          purple: "#945BFF",
          magenta: "#F05DEB",
        },
        surface: {
          DEFAULT: "#0D121F",
          highlight: "#121A2B",
        },
        text: {
          primary: "#F8FBFF",
          muted: "#9BA6C6",
          subtle: "#7F8AB2",
        },
      },
      borderRadius: {
        xl: "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Bricolage Grotesque", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
