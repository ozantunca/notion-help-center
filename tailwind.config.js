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
        orange: '#ffa659',
        'soft-border': '#ddd',
        'light-blue': '#1890ff',
        'dark-blue': '#096dd9',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
