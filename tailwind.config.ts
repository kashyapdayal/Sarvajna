import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        paper: {
          50: "#FCFAF6",
          100: "#F7F4EE",
          200: "#EFEAE0",
          300: "#DFD8CB",
          800: "#2B2823",
          900: "#1A1815",
        },
        sage: {
          50: "#F2F7F2",
          100: "#E4EFE4",
          200: "#C9DFC9",
          500: "#4B8752",
          600: "#3D6E42",
          700: "#2F5433",
        },
        matcha: {
          DEFAULT: "#5A8F5E",
          light: "#EAF3EB",
          dark: "#3B613E",
        },
        amber: {
          accent: "#D97706",
          light: "#FEF3C7",
        },
        lavender: {
          accent: "#6366F1",
          light: "#EEF2FF",
        },
        coral: {
          accent: "#E11D48",
          light: "#FFE4E6",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        'tactile': '0 2px 0 0 rgba(0, 0, 0, 0.05), 0 4px 12px 0 rgba(0, 0, 0, 0.04)',
        'tactile-hover': '0 4px 0 0 rgba(0, 0, 0, 0.07), 0 8px 16px 0 rgba(0, 0, 0, 0.06)',
        'tactile-pressed': '0 0 0 0 rgba(0, 0, 0, 0.05), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'dock': '0 20px 35px -10px rgba(0, 0, 0, 0.09), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
