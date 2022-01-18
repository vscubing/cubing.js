import type { KPuzzle } from "../../../../../kpuzzle";
import type { PuzzleLoader } from "../../../../../puzzles";
import { TwistyPropDerived } from "../../TwistyProp";

export class KPuzzleProp extends TwistyPropDerived<
  { puzzleLoader: PuzzleLoader },
  KPuzzle
> {
  async derive(inputs: { puzzleLoader: PuzzleLoader }): Promise<KPuzzle> {
    console.log(inputs.puzzleLoader);
    return inputs.puzzleLoader.kpuzzle();
  }
}
