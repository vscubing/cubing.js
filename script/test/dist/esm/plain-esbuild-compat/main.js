import { join } from "node:path";
import { stdout } from "process";
import { execPromiseLogged } from "../../../../lib/execPromise.js";
import { needFolder } from "../../../../lib/need-folder.js";
import { NPX } from "../../../../config/runtime.js";
import { packageNames } from "../../../../lib/packages.js";

const OUT_DIR = "./.temp/plain-esbuild-compat";

await needFolder(
  new URL("../../../../../dist/esm", import.meta.url).pathname,
  "make build-esm",
);

const dist_entries = packageNames
  .map((e) => join("dist/esm/", e, "/index.js"))
  .join(" ");
const cmd = `npx esbuild --bundle --splitting --outdir="${OUT_DIR}" --format=esm --minify ${dist_entries}`;
console.log(cmd);
stdout.write(
  "Testing that the ESM build can be transpiled by `esbuild` with default compat settings...",
);
await execPromiseLogged(
  `${NPX} esbuild --bundle --splitting --outdir="${OUT_DIR}" --format=esm --minify ${dist_entries}`,
);
console.log(" ✅ Success!");
