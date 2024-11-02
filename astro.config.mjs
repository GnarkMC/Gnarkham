import { defineConfig } from "astro/config";
import qwikdev from "@qwikdev/astro";

export default defineConfig({
  integrations: [qwikdev()],
  output: "static",
  site: "https://gnarkmc.github.io", // Add your site URL
  base: "/gnark", // This should match your repository name exactly
  build: {
    assets: "_assets", // This helps with MIME type issues
  },
  vite: {
    build: {
      assetsInlineLimit: 0, // Ensures assets are properly handled
    },
  },
});
