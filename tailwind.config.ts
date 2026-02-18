import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: "#8b5cf6",
        accent: "#22d3ee",
        success: "#10b981",
        warning: "#f59e0b",
        destructive: "#ef4444",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
};

export default config;
