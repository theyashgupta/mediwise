import base from "@mediwise/config/eslint";
import { readdirSync } from "node:fs";
import { defineConfig } from "eslint/config";

const modules = readdirSync(new URL("./src/modules", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const moduleIndexes = modules.map((name) => `./modules/${name}/index.ts`);

export default defineConfig(base, {
  rules: {
    "import/no-restricted-paths": [
      "error",
      {
        basePath: import.meta.dirname,
        zones: [
          ...modules.map((name) => ({
            target: `./src/modules/${name}`,
            from: "./src/modules",
            except: [
              `./${name}`,
              ...modules.filter((other) => other !== name).map((other) => `./${other}/index.ts`),
            ],
            message: "Import another module only through its index.ts.",
          })),
          {
            target: "./src/modules",
            from: ["./src/routes", "./src/layouts", "./src/app"],
            message: "Modules may not import routes, layouts or app.",
          },
          {
            target: "./src/routes",
            from: "./src",
            except: ["./layouts", ...moduleIndexes],
            message: "Routes import only a module's index.ts or a layout.",
          },
          {
            target: ["./src/common", "./src/components", "./src/lib", "./src/config"],
            from: ["./src/modules", "./src/routes", "./src/layouts", "./src/app"],
            message: "Shared code may not import modules, routes, layouts or app.",
          },
        ],
      },
    ],
  },
});
