import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        data: ['JetBrains Mono', 'monospace'],
        ui: ['system-ui', 'sans-serif'],
      },
      colors: {
        accent: "#22C55E",
        'accent-muted': "rgba(34,197,94,0.15)",
        'accent-border': "rgba(34,197,94,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
