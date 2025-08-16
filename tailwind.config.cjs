module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}", // OK to keep (harmless) if you have pages dir
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"), // optional: ensure the package is installed if you use it
  ],
};