import { existsSync } from "node:fs";
import { access, stat } from "node:fs/promises";

export async function needFolder(folder, cmd) {
  if (!(await pathExists(folder))) {
    console.error(
      `\nFolder does not exist:\n${folder}\n\nRun \`${cmd}\` first!\n\b`,
    );
    process.exit(1);
  }
}

export async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (e) {
    if (e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
}
