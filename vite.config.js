import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/epc": {
        target: "http://127.0.0.1:8443",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://127.0.0.1:8443",
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
