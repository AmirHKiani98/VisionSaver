// electron.vite.config.mjs
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
var __electron_vite_injected_dirname = "C:\\MyApps\\VisionSaver\\cameravision";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__electron_vite_injected_dirname, "src/renderer/index.html"),
          splash: resolve(__electron_vite_injected_dirname, "src/renderer/loading.html")
        },
        // Add this section to exclude native modules
        external: [
          "nodejs-polars",
          "nodejs-polars-win32-x64-msvc",
          /\.node$/
        ]
      }
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src")
      }
    },
    optimizeDeps: {
      // Add this section to exclude nodejs-polars from optimization
      exclude: ["nodejs-polars"]
    },
    plugins: [react(), tailwindcss()]
  }
});
export {
  electron_vite_config_default as default
};
