/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
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
          blue: '#4DA2FF',
          'blue-light': '#6FBCFF',
          'blue-dark': '#2563EB',
          cyan: '#06B6D4',
          'cyan-light': '#22D3EE',
          turquoise: '#14B8A6',
        },
        dark: {
          bg: '#0F1419',
          surface: '#1A1F2E',
          'surface-light': '#1F2937',
          border: '#2A3441',
          text: '#E5E7EB',
          muted: '#9CA3AF',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      backgroundImage: {
        'sui-gradient': 'linear-gradient(135deg, #4DA2FF 0%, #6FBCFF 100%)',
        'sui-gradient-hover': 'linear-gradient(135deg, #2563EB 0%, #4DA2FF 100%)',
        'sui-glow': 'radial-gradient(circle at center, rgba(77, 162, 255, 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}

