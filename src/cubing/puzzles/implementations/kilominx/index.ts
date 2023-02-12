import type { PuzzleLoader } from "../..";
import type { Move } from "../../../alg";
import { KPuzzle, KTransformationData } from "../../../kpuzzle";
import type { ExperimentalPGNotation } from "../../../puzzle-geometry";
import { asyncGetPuzzleGeometry } from "../../async/async-pg3d";
import { getCached } from "../../async/lazy-cached";

// TODO: Make this consistent with Megaminx corners
export const kilominx: PuzzleLoader = {
  id: "kilominx",
  fullName: "Kilominx",
  kpuzzle: getCached(async () => {
    const pg = await asyncGetPuzzleGeometry("megaminx + chopasaurus");
    const kpuzzleDefinition = structuredClone(pg.getKPuzzleDefinition(true));
    delete kpuzzleDefinition.orbits.CENTERS;
    delete kpuzzleDefinition.orbits.CENTERS2;
    delete kpuzzleDefinition.startStateData.CENTERS;
    delete kpuzzleDefinition.startStateData.CENTERS2;
    for (const moveDefinition of Object.values(kpuzzleDefinition.moves)) {
      delete (moveDefinition as any).CENTERS;
      delete (moveDefinition as any).CENTERS2;
    }
    kpuzzleDefinition.name = "kilominx";
    const puzzleGeometry = await import("../../../puzzle-geometry");
    const pgNotation = new puzzleGeometry.ExperimentalPGNotation(
      pg,
      pg.getOrbitsDef(true),
    );
    const kpuzzle = new KPuzzle(kpuzzleDefinition, {
      experimentalPGNotation: {
        lookupMove: (move: Move): KTransformationData | null => {
          return pgNotation.lookupMove(move);
        },
      } as ExperimentalPGNotation,
    });
    return kpuzzle;
  }),
  svg: getCached(async () => {
    return (
      await import("../dynamic/unofficial/puzzles-dynamic-unofficial")
    ).kilominxSVG;
  }),
};
