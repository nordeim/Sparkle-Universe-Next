# next.config.mjs
```mjs
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for Socket.IO and other Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
      }
    }
    
    // Preserve existing SVG handling
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    )
    
    if (fileLoaderRule) {
      config.module.rules.push(
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: /url/, // *.svg?url
        },
        {
          test: /\.svg$/i,
          issuer: fileLoaderRule.issuer,
          resourceQuery: { not: [...(fileLoaderRule.resourceQuery?.not || []), /url/] },
          use: ['@svgr/webpack'],
        },
      )
      
      fileLoaderRule.exclude = /\.svg$/i
    }
    
    return config
  },
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Environment variables (non-sensitive defaults)
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  },
  
  // Output configuration
  output: 'standalone',
  
  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'],
    } : false,
  },
  
  // Performance monitoring
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
}

// Dynamic configuration based on environment
const configWithAnalyzer = async () => {
  if (process.env.ANALYZE === 'true') {
    try {
      const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default
      return withBundleAnalyzer({
        enabled: true,
      })(nextConfig)
    } catch (e) {
      console.warn('Bundle analyzer not installed, skipping...')
      return nextConfig
    }
  }
  return nextConfig
}

export default process.env.ANALYZE === 'true' ? await configWithAnalyzer() : nextConfig

```

# postcss.config.mjs
```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          colormin: true,
          convertValues: true,
          reduceIdents: true,
        }],
      },
    } : {}),
  },
};

export default config;

```

# tailwind.config.ts
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/features/**/*.{js,ts,jsx,tsx}',
    './src/emails/**/*.{js,ts,jsx,tsx}',
    '!./src/**/*.test.{js,ts,jsx,tsx}',
    '!./src/**/*.spec.{js,ts,jsx,tsx}',
    '!./src/**/*.stories.{js,ts,jsx,tsx}',
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
          purple: '#8B5CF6',
          'purple-dark': '#7C3AED',
          'purple-light': '#A78BFA',
          pink: '#EC4899',
          'pink-dark': '#DB2777',
          'pink-light': '#F472B6',
          blue: '#3B82F6',
          'blue-dark': '#2563EB',
          'blue-light': '#60A5FA',
          green: '#10B981',
          'green-dark': '#059669',
          'green-light': '#34D399',
          gold: '#F59E0B',
          'gold-dark': '#D97706',
          'gold-light': '#FCD34D',
        },
        // Badge Rarity Colors (8 tiers)
        rarity: {
          common: '#9CA3AF',
          uncommon: '#10B981',
          rare: '#3B82F6',
          epic: '#8B5CF6',
          legendary: '#F59E0B',
          mythic: '#EC4899',
          limited: '#EF4444',
          seasonal: '#14B8A6',
        },
        // Status colors
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },
        error: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 2px)',
        '2xl': 'calc(var(--radius) + 4px)',
        '3xl': 'calc(var(--radius) + 6px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.625rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
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
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'bounce-in': {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.3)'
          },
          '50%': { 
            transform: 'scale(1.05)'
          },
          '70%': { 
            transform: 'scale(0.9)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
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
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'bounce-in': 'bounce-in 0.4s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'sparkle-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #10B981 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        'light-gradient': 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        'mesh-gradient': `
          radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
          radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
          radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
          radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
          radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
          radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
          radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
        `,
      },
      backdropBlur: {
        xs: '2px',
        xl: '20px',
        '2xl': '40px',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.6)',
        'glow-xl': '0 0 60px rgba(139, 92, 246, 0.7)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Custom plugin for Sparkle Universe utilities
    plugin(function({ addBase, addUtilities, addComponents, theme }) {
      // Base styles
      addBase({
        ':root': {
          '--radius': '0.5rem',
        },
        'html': {
          'font-smooth': 'antialiased',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      })
      
      // Utility classes
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
          'text-fill-color': 'transparent',
        },
        '.sparkle-border': {
          'border-image': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981) 1',
        },
        '.sparkle-shadow': {
          'box-shadow': '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)',
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        '.mask-gradient': {
          'mask-image': 'linear-gradient(to bottom, black, transparent)',
          '-webkit-mask-image': 'linear-gradient(to bottom, black, transparent)',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.no-tap-highlight': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.perspective-1000': {
          'perspective': '1000px',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
      })
      
      // Component classes
      addComponents({
        '.btn-sparkle': {
          'position': 'relative',
          'overflow': 'hidden',
          'background': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 10px 40px rgba(139, 92, 246, 0.4)',
          },
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'top': '0',
            'left': '-100%',
            'width': '100%',
            'height': '100%',
            'background': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            'transition': 'left 0.5s',
          },
          '&:hover::before': {
            'left': '100%',
          },
        },
        '.card-sparkle': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.input-sparkle': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'transition': 'all 0.3s ease',
          '&:focus': {
            'border-color': '#8B5CF6',
            'box-shadow': '0 0 0 3px rgba(139, 92, 246, 0.1)',
          },
        },
      })
    }),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}

export default config

```

# tailwind.config.ts
```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
    './src/features/**/*.{js,ts,jsx,tsx}',
    './src/emails/**/*.{js,ts,jsx,tsx}',
    '!./src/**/*.test.{js,ts,jsx,tsx}',
    '!./src/**/*.spec.{js,ts,jsx,tsx}',
    '!./src/**/*.stories.{js,ts,jsx,tsx}',
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
          purple: '#8B5CF6',
          'purple-dark': '#7C3AED',
          'purple-light': '#A78BFA',
          pink: '#EC4899',
          'pink-dark': '#DB2777',
          'pink-light': '#F472B6',
          blue: '#3B82F6',
          'blue-dark': '#2563EB',
          'blue-light': '#60A5FA',
          green: '#10B981',
          'green-dark': '#059669',
          'green-light': '#34D399',
          gold: '#F59E0B',
          'gold-dark': '#D97706',
          'gold-light': '#FCD34D',
        },
        // Badge Rarity Colors (8 tiers)
        rarity: {
          common: '#9CA3AF',
          uncommon: '#10B981',
          rare: '#3B82F6',
          epic: '#8B5CF6',
          legendary: '#F59E0B',
          mythic: '#EC4899',
          limited: '#EF4444',
          seasonal: '#14B8A6',
        },
        // Status colors
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
        },
        error: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 2px)',
        '2xl': 'calc(var(--radius) + 4px)',
        '3xl': 'calc(var(--radius) + 6px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.625rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
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
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'bounce-in': {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.3)'
          },
          '50%': { 
            transform: 'scale(1.05)'
          },
          '70%': { 
            transform: 'scale(0.9)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
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
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'bounce-in': 'bounce-in 0.4s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'sparkle-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #10B981 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        'light-gradient': 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
        'mesh-gradient': `
          radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 0%),
          radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%),
          radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%),
          radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%),
          radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%),
          radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%),
          radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)
        `,
      },
      backdropBlur: {
        xs: '2px',
        xl: '20px',
        '2xl': '40px',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.6)',
        'glow-xl': '0 0 60px rgba(139, 92, 246, 0.7)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    // Custom plugin for Sparkle Universe utilities
    plugin(function({ addBase, addUtilities, addComponents, theme }) {
      // Base styles
      addBase({
        ':root': {
          '--radius': '0.5rem',
        },
        'html': {
          'font-smooth': 'antialiased',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
      })
      
      // Utility classes
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
          'text-fill-color': 'transparent',
        },
        '.sparkle-border': {
          'border-image': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981) 1',
        },
        '.sparkle-shadow': {
          'box-shadow': '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(236, 72, 153, 0.2)',
        },
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.text-pretty': {
          'text-wrap': 'pretty',
        },
        '.mask-gradient': {
          'mask-image': 'linear-gradient(to bottom, black, transparent)',
          '-webkit-mask-image': 'linear-gradient(to bottom, black, transparent)',
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-none': {
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.no-tap-highlight': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.preserve-3d': {
          'transform-style': 'preserve-3d',
        },
        '.perspective-1000': {
          'perspective': '1000px',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
      })
      
      // Component classes
      addComponents({
        '.btn-sparkle': {
          'position': 'relative',
          'overflow': 'hidden',
          'background': 'linear-gradient(135deg, #8B5CF6, #EC4899, #10B981)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 10px 40px rgba(139, 92, 246, 0.4)',
          },
          '&::before': {
            'content': '""',
            'position': 'absolute',
            'top': '0',
            'left': '-100%',
            'width': '100%',
            'height': '100%',
            'background': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            'transition': 'left 0.5s',
          },
          '&:hover::before': {
            'left': '100%',
          },
        },
        '.card-sparkle': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'box-shadow': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        },
        '.input-sparkle': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'transition': 'all 0.3s ease',
          '&:focus': {
            'border-color': '#8B5CF6',
            'box-shadow': '0 0 0 3px rgba(139, 92, 246, 0.1)',
          },
        },
      })
    }),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}

export default config

```

# tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": false,
    "noPropertyAccessFromIndexSignature": false,
    "noImplicitThis": true,
    "useDefineForClassFields": true,
    "alwaysStrict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "useUnknownInCatchVariables": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/server/*": ["./src/server/*"],
      "@/app/*": ["./src/app/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/public/*": ["./public/*"]
    },
    "types": [
      "node",
      "jest"
    ],
    "typeRoots": [
      "./node_modules/@types",
      "./src/types"
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.mjs",
    "**/*.cjs",
    ".next/types/**/*.ts",
    "src/**/*",
    "prisma/**/*",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "next.config.mjs",
    "src/types/global.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    ".next",
    "out",
    "coverage",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.stories.ts",
    "**/*.stories.tsx",
    ".turbo",
    ".vercel",
    "cypress",
    "playwright"
  ],
  "ts-node": {
    "compilerOptions": {
      "module": "commonjs"
    }
  }
}

```

