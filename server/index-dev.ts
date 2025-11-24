import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

import { nanoid } from "nanoid";
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";

import viteConfig from "../vite.config";
import runApp from "./app";

// إصلاح __dirname في Node.js
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite(app: Express, server: Server) {
  const viteLogger = createLogger();

  // إعداد HMR
  const hmrConfig: any = { server };

  // إذا بيئة Replit
  if (process.env.REPL_ID) {
    const host = process.env.REPL_SLUG
      ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : undefined;

    if (host) {
      hmrConfig.host = host;
      hmrConfig.protocol = "wss";
      hmrConfig.port = 443;
    }
  }

  const serverOptions = {
    middlewareMode: true,
    hmr: hmrConfig,
    allowedHosts: true as const,
  };

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          // لا تستخدم process.exit() في serverless
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html"
        );

        // اقرأ الملف من القرص دائماً
        let template = await fs.promises.readFile(clientTemplate, "utf-8");

        // أضف query string لتجنب cache
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`
        );

        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        console.error("Error rendering page:", e);
        res.status(500).send("Internal Server Error");
      }
    });
  } catch (err) {
    console.error("Vite server setup failed:", err);
    throw err; // إذا setup فشل، أترك الخطأ ليتم التعامل معه في runApp
  }
}

// تشغيل التطبيق
(async () => {
  try {
    await runApp(setupVite);
  } catch (err) {
    console.error("App failed to start:", err);
  }
})();
