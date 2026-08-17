/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#090C0B",
        surface: "#121815",
        surfaceHover: "#1A2320",
        ink: "#EAF2EE",
        forest: {
          DEFAULT: "#1FAE7B",
          light: "#3FD69D",
          dark: "#128A5F",
        },
        gold: "#E7B84F",
        brick: "#E2624B",
        line: "#212B26",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      keyframes: {
        fadeInUp: { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.92)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        floatSlow: { "0%, 100%": { transform: "translateY(0) rotate(0deg)" }, "50%": { transform: "translateY(-10px) rotate(2deg)" } },
        pulseDot: { "0%, 60%, 100%": { opacity: "0.25", transform: "scale(0.85)" }, "30%": { opacity: "1", transform: "scale(1)" } },
        gradientShift: { "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
        glowPulse: { "0%, 100%": { boxShadow: "0 0 0px rgba(31,174,123,0.0)" }, "50%": { boxShadow: "0 0 32px rgba(31,174,123,0.35)" } },
        blobMove: { "0%, 100%": { transform: "translate(0, 0) scale(1)" }, "33%": { transform: "translate(30px, -20px) scale(1.08)" }, "66%": { transform: "translate(-20px, 20px) scale(0.95)" } },
        spinSlow: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        slideInRight: { "0%": { opacity: "0", transform: "translateX(20px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        countUp: { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2.2s linear infinite",
        "float-slow": "floatSlow 5s ease-in-out infinite",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        "glow-pulse": "glowPulse 2.6s ease-in-out infinite",
        "blob-move": "blobMove 14s ease-in-out infinite",
        "spin-slow": "spinSlow 0.8s linear infinite",
        "slide-in-right": "slideInRight 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "count-up": "countUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
