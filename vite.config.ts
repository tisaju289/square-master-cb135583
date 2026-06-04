import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: true,
  vite: {
    server: {
      host: "0.0.0.0",
      port: 5000,
      allowedHosts: true,
    },
  },
});
