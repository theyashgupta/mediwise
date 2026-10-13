import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { siteFiles } from "./src/config/site-files";

/**
 * Serves and emits the manifest, robots.txt and sitemap.xml with absolute URLs on the app origin.
 *
 * @remarks
 * Files in `public` are copied as they are, so a file that names the origin has to be generated.
 */
function siteFilesPlugin(appOrigin: string): Plugin {
  const files = siteFiles(appOrigin);
  return {
    name: "mediwise-site-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const body = req.url && files[req.url];
        if (!body) return next();
        res.end(body);
      });
    },
    generateBundle() {
      for (const [path, source] of Object.entries(files)) {
        this.emitFile({ type: "asset", fileName: path.slice(1), source });
      }
    },
  };
}

/**
 * Forces the test mode in Vitest when the shell exports `NODE_ENV=production`.
 *
 * @remarks
 * A production NODE_ENV makes Vite skip the `development` export of workspace packages and loads React without `act`.
 */
function forceTestNodeEnv(mode: string) {
  if (mode === "test") process.env.NODE_ENV = "test";
}

export default defineConfig(({ mode }) => {
  forceTestNodeEnv(mode);
  const appOrigin = new URL(
    loadEnv(mode, import.meta.dirname, "VITE_").VITE_APP_ORIGIN || "http://localhost:5173",
  ).origin;
  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      siteFilesPlugin(appOrigin),
    ],
    define: { "import.meta.env.VITE_APP_ORIGIN": JSON.stringify(appOrigin) },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
      testTimeout: 15_000,
      env: { VITE_SUPABASE_URL: "http://localhost:54321", VITE_SUPABASE_ANON_KEY: "test" },
    },
  };
});
