/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sui Brand Colors
        sui: {
          blue: "#4DA2FF",
          "blue-light": "#6FBCFF",
          "blue-dark": "#2563EB",
          cyan: "#06B6D4",
          "cyan-light": "#22D3EE",
          turquoise: "#14B8A6",
        },
        dark: {
          bg: "#0F1419",
          surface: "#1A1F2E",
          "surface-light": "#1F2937",
          border: "#2A3441",
          text: "#E5E7EB",
          muted: "#9CA3AF",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        "sui-gradient": "linear-gradient(135deg, #4DA2FF 0%, #6FBCFF 100%)",
        "sui-gradient-hover":
          "linear-gradient(135deg, #2563EB 0%, #4DA2FF 100%)",
        "sui-glow":
          "radial-gradient(circle at center, rgba(77, 162, 255, 0.15) 0%, transparent 70%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 20px rgba(77, 162, 255, 0.6), 0 0 40px rgba(111, 188, 255, 0.3)",
          },
          "50%": {
            boxShadow:
              "0 0 40px rgba(77, 162, 255, 0.8), 0 0 60px rgba(111, 188, 255, 0.5)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "rotate-gradient": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "gradient-shift": "gradient-shift 20s ease infinite",
        "slide-in-bottom": "slide-in-bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-left": "slide-in-left 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scale-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "rotate-gradient": "rotate-gradient 3s linear infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
