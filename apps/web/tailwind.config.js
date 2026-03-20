import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────
        crail: {
          DEFAULT: '#C15F3C',
          50:  '#FBF0EB',
          100: '#F5DDD3',
          200: '#EBBBA7',
          300: '#E1997B',
          400: '#D7774F',
          500: '#C15F3C',
          600: '#9A4B2F',
          700: '#733822',
          800: '#4C2516',
          900: '#261209'
        },
        cloudy: {
          DEFAULT: '#B1ADA1',
          50:  '#F5F4F2',
          100: '#EAE9E5',
          200: '#D5D2CB',
          300: '#C0BCB2',
          400: '#B1ADA1',
          500: '#9C9789',
          600: '#7D7970',
          700: '#5E5A54',
          800: '#3F3C38',
          900: '#1F1E1C'
        },
        pampas: {
          DEFAULT: '#F4F3EE',
          dark:    '#E8E7E0'
        },
        // ── Semantic aliases (used via @apply / className) ─────
        background:  '#F4F3EE',
        foreground:  '#2E2822',
        border:      '#D5D2CB',
        input:       '#D5D2CB',
        ring:        '#C15F3C',
        muted: {
          DEFAULT:    '#E8E7E0',
          foreground: '#7D7970'
        },
        accent: {
          DEFAULT:    '#F0EEE8',
          foreground: '#9A4B2F'
        },
        destructive: {
          DEFAULT:    '#DC2626',
          foreground: '#FFFFFF'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' }
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        shimmer:          'shimmer 2s linear infinite'
      },
      boxShadow: {
        paper:      '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'paper-lg': '0 4px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.10)',
        card:       '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: [animate]
}