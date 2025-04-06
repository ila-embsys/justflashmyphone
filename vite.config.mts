import react from "@vitejs/plugin-react";
import { build, type UserConfig } from "vite";

export default {
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  worker: {
    format: "es"
  },
  build: {
    target: 'esnext',
  }

} satisfies UserConfig;
