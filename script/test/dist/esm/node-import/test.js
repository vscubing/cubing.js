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

import { Alg } from "../../../../../dist/esm/alg";
import { KState } from "../../../../../dist/esm/kpuzzle";
import { cube2x2x2 } from "../../../../../dist/esm/puzzles";
import { randomScrambleForEvent } from "../../../../../dist/esm/scramble";
import {
  experimentalSolveTwsearch,
  setSearchDebug,
} from "../../../../../dist/esm/search";

setSearchDebug({ disableStringWorker: true });

(async () => {
  (await randomScrambleForEvent("222")).log();
  (await randomScrambleForEvent("333")).log();

  const scramble222 = new Alg("R' F2 R F2 R F' U2 R' F' L2 F'");
  const kpuzzle = await cube2x2x2.kpuzzle();
  const scramble222Transformation = kpuzzle.algToTransformation(scramble222);
  const scramble222Solution = await experimentalSolveTwsearch(
    kpuzzle,
    scramble222Transformation.toKState(),
    { moveSubset: "ULFR".split(""), minDepth: 11 },
  );
  scramble222.concat(".").concat(scramble222Solution).log();
  if (
    !scramble222Transformation
      .applyAlg(scramble222Solution)
      .isIdentical(kpuzzle.identityTransformation())
  ) {
    throw new Error("Invalid solution!");
  }
  const numMoves = scramble222Solution.experimentalNumChildAlgNodes();
  if (numMoves < 11) {
    throw new Error(`Solution too short (at least 11 expected): ${numMoves}`);
  }

  console.log("Success!");
})();
