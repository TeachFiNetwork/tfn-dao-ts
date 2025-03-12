import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "tailwindcss";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(process.env.npm_package_version),
  },
  server: {
    port: Number(process.env.PORT) || 3001,
    strictPort: true,
    host: true,
    watch: {
      usePolling: false,
      useFsEvents: false,
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
    basicSsl(),
  ],
  build: {
    outDir: "build",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  preview: {
    port: 3002,
    host: "localhost",
    strictPort: true,
  },
});
