import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Builds a static single-page app into dist/, which Capacitor bundles into the iOS app.
export default defineConfig({
  base: "./",
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
  build: { outDir: "dist", target: "es2022", sourcemap: false },
});
