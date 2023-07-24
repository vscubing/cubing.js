import { join } from "node:path";
import { cp, mkdir } from "node:fs/promises";

import { execPromise } from "../../../../lib/execPromise.js";

export const port = 1236;

const packageSrcPath = new URL("./vite-package", import.meta.url).pathname; // relative to this file
const packageTempRoot = new URL("../../../../../.temp", import.meta.url)
  .pathname;
const packageTempPath = join(packageTempRoot, "vite-package");

export async function installServer() {
  await mkdir(packageTempRoot, { recursive: true });
  await cp(packageSrcPath, packageTempRoot, { recursive: true }); // TODO: cpSync?
  await execPromise("npm install", { cwd: packageTempPath });
}

export function startServer() {
  execPromise(`npx vite serve --port ${port}`, {
    cwd: packageTempPath,
  }).then(console.error);
}
