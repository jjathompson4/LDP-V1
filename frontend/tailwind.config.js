/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom colors if needed, but starting with standard Tailwind colors
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Assuming Inter or similar
            }
        },
    },
    plugins: [],
}
