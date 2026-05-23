/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'Outfit', 'sans-serif'],
            },
            colors: {
                neutral: {
                    850: '#1f2937',
                    900: '#111827',
                    950: '#030712', // Ultra dark background
                },
                glass: {
                    stroke: 'rgba(255,255,255,0.08)',
                    fill: 'rgba(30,30,35,0.6)',
                },
                // Semantic colors mapped to CSS variables for theming
                app: {
                    bg: 'var(--bg-app)',
                    surface: 'var(--bg-surface)',
                    glass: 'var(--bg-glass)',
                    'glass-heavy': 'var(--bg-glass-heavy)',
                },
                theme: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    border: 'var(--border-glass)',
                    highlight: 'var(--border-glass-highlight)',
                    input: 'var(--input-bg)',
                    'input-border': 'var(--input-border)',
                    accent: 'var(--accent-primary)',
                    surface: 'var(--bg-surface)',
                    'bg-secondary': 'var(--dock-bg)',
                    'bg-tertiary': 'var(--bg-glass)',
                }
            },
            boxShadow: {
                'glass-lg': '0 20px 40px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                'glass-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.4)',
                'theme-card': '0 8px 32px var(--card-shadow)',
            },
        },
    },
    plugins: [],
}
