/** Paleta tomada del mockup de Figma (Hotel Hunapú). */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crema: { DEFAULT: "#F4EEE2", 50: "#FAF7F0", 100: "#F4EEE2", 200: "#ECE3D2", 300: "#DDD0B8" },
        bronce: { DEFAULT: "#B08D57", 600: "#9A7745", 700: "#7F6137", 100: "#EBDDC3" },
        tinta: { DEFAULT: "#1E1C18", 700: "#3A362F", 500: "#6B6254", 400: "#8C8272" },
        linea: "#E1D6C1",
        ok: "#4C7A4F",
        error: "#A3402F",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: { etiqueta: "0.14em" },
    },
  },
  plugins: [],
};
