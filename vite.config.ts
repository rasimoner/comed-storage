import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: "dist",
        rollupOptions: {
            input: "./src/main.ts",
            output: {
                entryFileNames: "main.js",
                assetFileNames: "assets/[name][extname]",
            },
        },
    },
});
