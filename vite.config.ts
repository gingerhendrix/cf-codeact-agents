import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [alchemy(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
