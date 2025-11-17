import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          50: 'hsl(110, 28%, 95%)',   // Lightest - for hover highlights
          100: 'hsl(110, 28%, 85%)',  // Very light - for backgrounds
          200: 'hsl(110, 28%, 70%)',  // Light - for selected states
          300: 'hsl(110, 28%, 55%)',  // Medium light
          400: 'hsl(110, 28%, 40%)',  // Medium
          500: 'hsl(110, 28%, 25%)',  // Medium dark
          600: 'hsl(110, 28%, 19%)',  // DEFAULT - Dark forest green
          700: 'hsl(110, 28%, 15%)',  // Darker - for text
          800: 'hsl(110, 28%, 12%)',  // Very dark
          900: 'hsl(110, 28%, 8%)',   // Darkest - for dark mode backgrounds
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          50: 'hsl(62, 32%, 95%)',    // Lightest olive
          100: 'hsl(62, 32%, 85%)',   // Very light
          200: 'hsl(62, 32%, 75%)',   // Light
          300: 'hsl(62, 32%, 65%)',   // Medium light
          400: 'hsl(62, 32%, 57%)',   // DEFAULT - Muted olive
          500: 'hsl(62, 32%, 47%)',   // Medium dark
          600: 'hsl(62, 32%, 37%)',   // Dark
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          50: 'hsl(169, 19%, 95%)',   // Lightest sage
          100: 'hsl(169, 19%, 85%)',  // Very light
          200: 'hsl(169, 19%, 75%)',  // Light
          300: 'hsl(169, 19%, 64%)',  // DEFAULT - Sage teal
          400: 'hsl(169, 19%, 54%)',  // Medium dark
          500: 'hsl(169, 19%, 44%)',  // Dark
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}

export default config
