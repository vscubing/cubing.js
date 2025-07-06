import "@vscubing/cubing/alg";
import "@vscubing/cubing/bluetooth";
import "@vscubing/cubing/kpuzzle";
import "@vscubing/cubing/notation";
import "@vscubing/cubing/protocol";
import "@vscubing/cubing/puzzle-geometry";
import "@vscubing/cubing/puzzles";
import "@vscubing/cubing/scramble";
import "@vscubing/cubing/search";
import "@vscubing/cubing/stream";
import "@vscubing/cubing/twisty";

import { setSearchDebug } from "@vscubing/cubing/search";

setSearchDebug({ disableStringWorker: true, scramblePrefetchLevel: "none" });

import { randomScrambleForEvent } from "@vscubing/cubing/scramble";

const eventsOrdered = [
  "333",
  "222",
  "555",
  "666",
  "777",
  "333bf",
  "333fm",
  "333oh",
  "clock",
  "minx",
  "pyram",
  "skewb",
  "sq1",
  "555bf",
  "333mbf",
  "redi_cube",
  "master_tetraminx",
];

const eventsParallel = ["kilominx", "444", "444bf", "fto"];

await (async () => {
  setSearchDebug({ forceNewWorkerForEveryScramble: true });
  const parallelPromise = Promise.all(
    eventsParallel.map(async (event) =>
      (await randomScrambleForEvent(event)).log(event),
    ),
  );
  setSearchDebug({ forceNewWorkerForEveryScramble: false });
  for (const event of eventsOrdered) {
    console.log(`Generating scramble for event: ${event}... `);
    (await randomScrambleForEvent(event)).log(event);
  }
  await parallelPromise;

  console.log("Success!");
})();
