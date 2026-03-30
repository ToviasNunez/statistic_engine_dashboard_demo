// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html"
  ],
  safelist: [
    'w-[300px]', 'h-[150px]', 'h-8'
  ],
  theme: {
    extend: {
      colors: {
        // Background tones
        background: {
          beige: "#F9F6EF",
          lavender: "#F3F0F8",
          darkSlate: "#1E293B",
          lightGray: "#F8FAFC",
        },
        // Card backgrounds
        card: {
          peach: "#FFEAD0",
          mint: "#DFF6E0",
          softGold: "#FFF4CC",
          softLavender: "#EAE1F7",
          white: "#FFFFFF",
          darkCard: "#334155",
        },
        // Professional gradients
        gradient: {
          primary: "#D95C12",
          secondary: "#F0B400",
          tertiary: "#82B366",
        },
        // Accents
        accent: {
          orange: "#D95C12",
          gold: "#F0B400",
          green: "#82B366",
          blue: "#3B82F6",
          purple: "#8B5CF6",
        },
        // Text tones
        text: {
          slate: "#4B4B4B",
          mutedBrown: "#6D4C41",
          dark: "#1E293B",
          light: "#94A3B8",
          white: "#FFFFFF",
        },
        // Status colors
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      // Professional shadows
      boxShadow: {
        'enterprise': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'enterprise-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'enterprise-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'inner-subtle': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      // Professional spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],

};
