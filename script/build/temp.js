// We await use  operations to reduce the risk of race conditions from
// interacting build systems.
import {
  mkdtemp,
  rmdir,
  writeFile,
  rename,
  mkdir,
  access,
} from "node:fs/promises";
import { join } from "node:path";
import { pathExists } from "../lib/need-folder.js";

const TEMP_ROOT = "./.temp/build/";

async function tempDirUncached() {
  if (!(await exists(TEMP_ROOT))) {
    await mkdir(TEMP_ROOT, { recursive: true });
  }
  const tempDir = await mkdtemp(TEMP_ROOT);

  // Try to clean up.
  // https://stackoverflow.com/a/49392671
  for (const eventName of ["exit", "SIGINT", "SIGTERM"]) {
    process.on(eventName, async (exitCode) => {
      if (await pathExists(tempDir)) {
        console.log(
          `Build process is exiting (${eventName}). Removing: ${tempDir}`,
        );
        await rmdir(tempDir);
      }
      process.exit(exitCode);
    });
  }
  return tempDir;
}

let cachedTempDir = null;
export async function tempDir() {
  // TODO: When can we use `??=`?
  return (cachedTempDir = cachedTempDir ? cachedTempDir : tempDirUncached());
}
