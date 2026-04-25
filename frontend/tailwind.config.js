/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        arcadia: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7dc8fc",
          400: "#38adf8",
          500: "#0e94e9",
          600: "#0275c7",
          700: "#035da1",
          800: "#074f85",
          900: "#0c426e",
          950: "#082a49",
        },
      },
    },
  },
  plugins: [],
};
