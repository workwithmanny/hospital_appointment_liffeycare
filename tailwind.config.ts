import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#14b8a6',
          hover: '#0d9488',
          light: '#f0fdfa',
          muted: '#5eead4',
        },
        surface: '#ffffff',
        base: '#fafaf9',
        subtle: '#f5f5f4',
        border: {
          DEFAULT: '#e7e5e4',
          strong: '#d6d3d1',
        },
        text: {
          primary: '#1c1917',
          secondary: '#78716c',
          tertiary: '#a8a29e',
        },
        status: {
          new: {
            bg: '#FEF9C3',
            text: '#854D0E',
            border: '#FDE047',
          },
          review: {
            bg: '#F3F4F6',
            text: '#374151',
            border: '#D1D5DB',
          },
          ready: {
            bg: '#DCFCE7',
            text: '#166534',
            border: '#86EFAC',
          },
          online: '#22C55E',
          offline: '#D1D5DB',
        },
        sidebar: {
          bg: '#FFFFFF',
          'active-bg': '#EFF6FF',
          'active-text': '#2563EB',
          text: '#6B7280',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
        dropdown: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
        modal: '0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.05)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: []
};

export default config;
