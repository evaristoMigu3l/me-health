/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          text: "#1A1A1A",
        },
        secondary: {
          text: "#6B7280",
        },
        background: "#F8F9FA",
        surface: "#FFFFFF",
        accent: {
          yellow: "#FDE68A", // Soft Yellow
          mint: "#6EE7B7",   // Mint Green
          teal: "#99F6E4",   // Light Teal
          lavender: "#C4B5FD", // Lavender/Purple
          pink: "#FBCFE8",   // Soft Pink
          orange: "#FDBA74", // Orange
        }
      },
    },
  },
  plugins: [],
}
