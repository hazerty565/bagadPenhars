import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "$lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  server: {
    watch: {},
  },
})
