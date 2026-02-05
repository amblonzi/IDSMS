/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1A56DB", // Professional Blue (IDSMS Brand)
                secondary: "#10B981", // Success Green
                accent: "#F59E0B", // Warning/Action Orange
            }
        },
    },
    plugins: [],
}
