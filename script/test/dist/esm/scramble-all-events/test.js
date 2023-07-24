import "../../../../../dist/esm/alg";
import "../../../../../dist/esm/bluetooth";
import "../../../../../dist/esm/kpuzzle";
import "../../../../../dist/esm/notation";
import "../../../../../dist/esm/protocol";
import "../../../../../dist/esm/puzzle-geometry";
import "../../../../../dist/esm/puzzles";
import "../../../../../dist/esm/scramble";
import "../../../../../dist/esm/search";
import "../../../../../dist/esm/stream";
import "../../../../../dist/esm/twisty";

import { setSearchDebug } from "../../../../../dist/esm/search";
setSearchDebug({ disableStringWorker: true, scramblePrefetchLevel: "none" });

import { randomScrambleForEvent } from "../../../../../dist/esm/scramble";

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
  "333mb",
  "redi_cube",
  "master_tetraminx",
];

const eventsParallel = ["kilominx", "444", "444bf", "fto"];

(async () => {
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
