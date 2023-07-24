import { join } from "node:path";
import { mkdir } from "node:fs/promises";

import { execPromise } from "../../../../lib/execPromise.js";
import { NPX } from "../../../../config/runtime.js";

export const port = 1236;

const packageSrcPath = new URL("./vite-package", import.meta.url).pathname; // relative to this file
const packageTempRoot = new URL("../../../../../.temp", import.meta.url)
  .pathname;
const packageTempPath = join(packageTempRoot, "vite-package");

export async function installServer() {
  await mkdir(packageTempRoot, { recursive: true });
  await execPromise(`cp -R ${packageSrcPath} ${packageTempRoot}`);
  await execPromise("bun install", { cwd: packageTempPath });
}

export function startServer() {
  execPromise(`${NPX} vite serve --port ${port}`, {
    cwd: packageTempPath,
  }).then(console.error);
}
