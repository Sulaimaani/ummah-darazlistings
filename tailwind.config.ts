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
        daraz: {
          orange: "#F57224",
          "orange-hover": "#D95E14",
          "orange-light": "#FFF5F0",
          teal: "#13a2c1",
          navy: "#1E293B",
          dark: "#0F172A",
          gray: "#64748B",
          border: "#E2E8F0",
          bg: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
