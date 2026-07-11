/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF7A59",
          light: "#FF9A7F",
          dark: "#E05A39",
          50: "#FFF0EB",
          100: "#FFE0D5",
          200: "#FFC1AA",
          300: "#FFA280",
          400: "#FF8A6A",
          500: "#FF7A59",
          600: "#E05A39",
          700: "#C04020",
          800: "#8B2A12",
          900: "#5A1A08",
        },
        accent: {
          DEFAULT: "#5FA36A",
          light: "#7FBF8A",
          dark: "#3F8349",
        },
        brand: {
          bg: "#FFF6EE",
          dark: "#4A2C2A",
          muted: "#8B6361",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        dmsans: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        card:        "0 2px 16px rgba(74,44,42,0.08)",
        "card-hover":"0 8px 32px rgba(74,44,42,0.14)",
        soft:        "0 4px 24px rgba(255,122,89,0.15)",
        glow:        "0 0 20px rgba(255,122,89,0.25)",
        "inner-sm":  "inset 0 1px 3px rgba(74,44,42,0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      backgroundImage: {
        "hero-pattern": "linear-gradient(135deg, #FFF6EE 0%, #FFE8DA 100%)",
        "card-gradient": "linear-gradient(180deg, transparent 40%, rgba(74,44,42,0.85) 100%)",
      },
    },
  },
  plugins: [],
};
