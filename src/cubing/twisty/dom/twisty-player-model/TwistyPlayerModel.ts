import type { Alg } from "../../../alg";
import type { PuzzleID, VisualizationFormat } from "../TwistyPlayerConfig";
import { AlgIssues, AlgProp } from "./depth-1/AlgProp";
import { PuzzleProp } from "./depth-1/PuzzleProp";
import { PuzzleAlgProp } from "./depth-2/PuzzleAlgProp";
import { VisualizationProp } from "./depth-3/VisualizationProp";

export class TwistyPlayerModel {
  algProp: AlgProp;
  setupProp: AlgProp;
  puzzleProp: PuzzleProp;
  puzzleAlgProp: PuzzleAlgProp;
  puzzleSetupProp: PuzzleAlgProp;
  visualizationProp: VisualizationProp;

  constructor() {
    this.algProp = new AlgProp();
    this.setupProp = new AlgProp();
    this.puzzleProp = new PuzzleProp();
    this.puzzleAlgProp = new PuzzleAlgProp(this.algProp, this.puzzleProp);
    this.puzzleSetupProp = new PuzzleAlgProp(this.setupProp, this.puzzleProp);
    this.visualizationProp = new VisualizationProp(
      this.puzzleAlgProp,
      this.puzzleSetupProp,
      this.puzzleProp,
    );
  }

  set alg(newAlg: Alg | string) {
    this.algProp.alg = newAlg;
  }

  get alg(): Alg {
    return this.algProp.alg;
  }

  set setup(newSetup: Alg | string) {
    this.setupProp.alg = newSetup;
  }

  get setup(): Alg {
    return this.setupProp.alg;
  }

  set puzzle(puzzleID: PuzzleID) {
    this.puzzleProp.puzzleID = puzzleID;
  }

  get puzzle(): PuzzleID {
    return this.puzzleProp.puzzleID;
  }

  set visualization(newVisualization: VisualizationFormat) {
    this.visualizationProp.visualization = newVisualization;
  }

  // TODO: Very TODO.
  get requestedVisualization(): VisualizationFormat {
    return this.visualizationProp.visualizationInput;
  }

  // TODO: Very TODO.
  get effectiveVisualization(): VisualizationFormat {
    return this.visualizationProp.derivedVisualization;
  }

  // get puzzleLoader(): PuzzleLoader {
  //   return this.puzzleProp.puzzleLoader;
  // }

  algIssues(): Promise<AlgIssues> {
    return this.puzzleAlgProp.algIssues();
  }
}
