import { needFolder } from "../lib/need-folder.js";
await needFolder(
  new URL("../../node_modules/barely-a-dev-server", import.meta.url).pathname,
  "bun install",
);

try {
  const { build, targets } = await import("./targets.js");

  const targetName = process.argv[2];
  if (!targetName) {
    console.error("not a target:", targetName);
    process.exit(1);
  }

  const dev = process.argv[3] === "dev";

  await (async () => {
    const target = targets[targetName];
    if (!target) {
      console.error("Unknown target:", targetName);
      process.exit(1);
    }
    await build(target, dev);
    console.log("Finished building!");
    // TODO: Why does this script hang (non-deterministically?) if we don't exit here?
    if (!dev) {
      process.exit(0);
    }
  })();
} catch (e) {
  console.log(e);
}
