import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EFF8FF",
          100: "#DBEFFE",
          200: "#BFE3FD",
          300: "#93D1FB",
          400: "#60B6F8",
          500: "#3B96F4",
          600: "#2478E9",
          700: "#1C62D6",
          800: "#1D4FAD",
          900: "#1E4589",
        },
      },
    },
  },
  plugins: [],
};

export default config;
