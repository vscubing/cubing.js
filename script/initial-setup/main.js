import { exists, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { execPromise } from "../lib/execPromise.js";
import { NPM } from "../config/runtime.js";

const TEMP_ROOT = "./.temp/initial-setup";
const TARGET_NODE_MODULES_PATH = "./node_modules";

if (await exists(TARGET_NODE_MODULES_PATH)) {
  process.exit(0);
}

console.log(
  `
Automatically installing a subset of dependencies.

Note that you have to run \`${NPM} install\` manually if you pull new code or want to run any tests.`,
);

const json = JSON.parse(await readFile("package.json", "utf8"));
const oldDevDependencies = json.devDependencies;
json.devDependencies = {};
for (const name of json.minimalDevDependencies) {
  json.devDependencies[name] = oldDevDependencies[name];
}
await mkdir(TEMP_ROOT, { recursive: true });
await writeFile(
  join(TEMP_ROOT, "package.json"),
  JSON.stringify(json, null, "  "),
);
console.log(await execPromise(`cd ${TEMP_ROOT} && ${npm} ci`));
await rename(join(TEMP_ROOT, "node_modules"), TARGET_NODE_MODULES_PATH);
