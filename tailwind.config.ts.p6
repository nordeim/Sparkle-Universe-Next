// tailwind.config.ts
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx,mdx}',
    './src/lib/**/*.{ts,tsx}',
    './src/emails/**/*.{ts,tsx}',
    '!./src/**/*.test.{ts,tsx}',
    '!./src/**/*.spec.{ts,tsx}',
    '!./src/**/*.stories.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
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
        // Sparkle Universe Theme Colors
        sparkle: {
          purple: '#8B5CF6',      // Vibrant Purple
          pink: '#EC4899',        // Hot Pink
          blue: '#3B82F6',        // Electric Blue
          green: '#10B981',       // Emerald
          gold: '#F59E0B',        // Gold
          gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981)',
        },
        // Badge Rarity Colors (8 tiers)
        rarity: {
          common: '#9CA3AF',      // Gray
          uncommon: '#10B981',    // Green
          rare: '#3B82F6',        // Blue
          epic: '#8B5CF6',        // Purple
          legendary: '#F59E0B',   // Gold
          mythic: '#EC4899',      // Pink
          limited: '#EF4444',     // Red
          seasonal: '#14B8A6',    // Teal
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'sparkle': {
          '0%, 100%': { 
            opacity: '0', 
            transform: 'scale(0) rotate(0deg)' 
          },
          '50%': { 
            opacity: '1', 
            transform: 'scale(1) rotate(180deg)' 
          },
        },
        'glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.8)' 
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            opacity: '1',
            filter: 'brightness(1)'
          },
          '50%': { 
            opacity: '0.8',
            filter: 'brightness(1.2)'
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sparkle-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #10B981 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Glassmorphism utilities
    function({ addUtilities }: any) {
      addUtilities({
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          'background': 'rgba(0, 0, 0, 0.3)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.sparkle-text': {
          'background': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.sparkle-border': {
          'border-image': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981) 1',
        },
        '.sparkle-shadow': {
          'box-shadow': '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)',
        },
      })
    },
  ],
}

export default config
