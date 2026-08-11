import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// Configurazione Vite esplicita: tutti i plugin sono dichiarati qui, senza
// preset esterni. Il progetto non dipende da alcuna piattaforma di terze parti.
//
// L'ordine conta: tsConfigPaths risolve gli alias prima che gli altri plugin
// tocchino i moduli, e viteReact va dopo tanstackStart.
export default defineConfig({
  plugins: [tsConfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
