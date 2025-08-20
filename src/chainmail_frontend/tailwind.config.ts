import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#6b8cff" }
      },
      boxShadow: {
        glow: "0 0 30px 5px rgba(107,140,255,0.45)"
      }
    }
  },
  plugins: []
} satisfies Config;
