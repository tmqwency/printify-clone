/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./client/**/*.{js,jsx,ts,tsx}",
        "./imports/ui/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#39B54A', // Printify green
                    600: '#2d9a3c',
                    700: '#22752e',
                    800: '#1a5a23',
                    900: '#14471c',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
