/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-soft': 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
        'primary-ring': 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
        orange: '#ffa659',
        'soft-border': '#ddd',
        'light-blue': '#1890ff',
        'dark-blue': '#096dd9',
      },
      boxShadow: {
        // Layered shadows: a tight contact shadow plus a wide, soft one.
        card: '0 1px 2px rgb(16 24 40 / 0.04), 0 1px 3px rgb(16 24 40 / 0.06)',
        'card-hover':
          '0 2px 4px -2px rgb(16 24 40 / 0.06), 0 16px 32px -12px rgb(16 24 40 / 0.18)',
        float: '0 4px 6px -4px rgb(16 24 40 / 0.08), 0 24px 48px -12px rgb(16 24 40 / 0.25)',
        glow: '0 8px 24px -8px color-mix(in srgb, var(--color-primary) 60%, transparent)',
        'glow-lg': '0 14px 32px -10px color-mix(in srgb, var(--color-primary) 70%, transparent)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(24px, -18px, 0) scale(1.06)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        wave: {
          '0%, 60%, 100%': { transform: 'rotate(0deg)' },
          '10%, 30%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'fade-down': 'fade-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        pop: 'pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) backwards',
        float: 'float 14s ease-in-out infinite',
        'float-slow': 'float 20s ease-in-out infinite reverse',
        'gradient-pan': 'gradient-pan 16s ease-in-out infinite',
        wave: 'wave 2.4s ease-in-out 0.6s 1 backwards',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
