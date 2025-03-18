import { type Alg, Move, AlgBuilder } from "../alg";
import {
  KPattern,
  type KPatternData,
  type KPatternOrbitData,
  type KTransformation,
} from "../kpuzzle";
import type { PuzzleLoader } from "../puzzles";
import {
  PieceStickering,
  PuzzleStickering,
  StickeringManager,
  type PieceSet,
} from "../puzzles/stickerings/mask";
import type { ExperimentalStickering } from "../twisty";

// stolen from `src/sites/experiments.cubing.net/cubing.js/live-reconstruction/index.ts`
export const getSolveAnalyzer = async (puzzleLoader: PuzzleLoader) => {
  const kpuzzle = await puzzleLoader.kpuzzle();

  const IGNORED_PIECE_VALUE = 9999; // TODO: This should really be set to the lowest otherwise unused piece number in the orbit.
  const ORIENTATION_ONLY_PIECE_VALUE = 9998; // TODO: This should really be set to the lowest otherwise unused piece number in the orbit.
  // const MYSTERY_PIECE_VALUE = 9997; // TODO: This should really be set to the lowest otherwise unused piece number in the orbit.

  type FlatPuzzleStickering = Record<string, PieceStickering[]>;
  function applyPuzzleStickering(
    pattern: KPattern,
    flatPuzzleStickering: FlatPuzzleStickering,
  ): KPattern {
    const newPatternData: KPatternData = {};
    for (const orbitDefinition of kpuzzle.definition.orbits) {
      const patternOrbit = pattern.patternData[orbitDefinition.orbitName];
      const maskOrbit = flatPuzzleStickering[orbitDefinition.orbitName];
      const newOrbitData: KPatternOrbitData & { orientationMod: number[] } = {
        pieces: [],
        orientation: [],
        orientationMod: [],
      };

      for (let i = 0; i < orbitDefinition.numPieces; i++) {
        switch (maskOrbit[i]) {
          case PieceStickering.PermuteNonPrimary:
          // fallthrough
          case PieceStickering.Regular:
          // fallthrough
          case PieceStickering.Dim: {
            newOrbitData.pieces.push(patternOrbit.pieces[i]);
            newOrbitData.orientation.push(patternOrbit.orientation[i]);
            newOrbitData.orientationMod.push(
              patternOrbit.orientationMod?.[i] ?? 0,
            );
            break;
          }
          case PieceStickering.Ignored:
          // fallthrough
          case PieceStickering.Invisible: {
            newOrbitData.pieces.push(IGNORED_PIECE_VALUE);
            newOrbitData.orientation.push(0);
            newOrbitData.orientationMod.push(1);
            break;
          }
          case PieceStickering.IgnoreNonPrimary:
          // fallthrough
          case PieceStickering.Ignoriented:
          // fallthrough
          case PieceStickering.OrientationWithoutPermutation:
          // fallthrough
          case PieceStickering.OrientationStickers: {
            newOrbitData.pieces.push(ORIENTATION_ONLY_PIECE_VALUE);
            newOrbitData.orientation.push(patternOrbit.orientation[i]);
            newOrbitData.orientationMod.push(
              patternOrbit.orientationMod?.[i] ?? 0,
            );
            break;
          }
          // case PieceStickering.Mystery: {
          //   newOrbitData.pieces.push(MYSTERY_PIECE_VALUE);
          //   newOrbitData.orientation.push(0);
          //   newOrbitData.orientationMod.push(1);
          //   break;
          // }
          default: {
            throw new Error(
              `Unrecognized \`PieceMaskAction\` value: ${maskOrbit[i]}`,
            );
          }
        }
      }
      newPatternData[orbitDefinition.orbitName] = newOrbitData;
    }
    return new KPattern(pattern.kpuzzle, newPatternData);
  }

  const cubeOrientations: {
    inverseTransformation: KTransformation;
    algToNormalize: Alg;
  }[] = [];
  for (const moveToSetU of [
    null,
    new Move("x"),
    new Move("x2"),
    new Move("x'"),
    new Move("z"),
    new Move("z'"),
  ]) {
    for (const moveToSetF of [
      null,
      new Move("y"),
      new Move("y2"),
      new Move("y'"),
    ]) {
      const algBuilder: AlgBuilder = new AlgBuilder();
      if (moveToSetU) {
        algBuilder.push(moveToSetU);
      }
      if (moveToSetF) {
        algBuilder.push(moveToSetF);
      }
      const algToNormalize = algBuilder.toAlg();
      const inverseTransformation = kpuzzle.algToTransformation(algToNormalize);
      cubeOrientations.push({
        inverseTransformation,
        algToNormalize,
      });
    }
  }

  const orientedSolvedPattern: KPattern = kpuzzle.defaultPattern();

  interface OrientationAnchor {
    orbitName: string;
    pieceIndex: number;
  }

  interface AnchorCoordinates {
    anchorPieceIndex: number;
    anchorOrientationIndex: number;
  }

  class PatternChecker {
    solvedPatternsByAnchorCoordinates: Record<
      number /* DRF piece */,
      Record<number /* DRF orientation */, KPattern>
    > = {};
    constructor(
      public name: string,
      private flatPuzzleStickering: FlatPuzzleStickering,
      private orientationAnchor: OrientationAnchor,
      public obviates: string[] = [],
    ) {
      for (const cubeOrientation of cubeOrientations) {
        const orientedPattern = orientedSolvedPattern.applyTransformation(
          cubeOrientation.inverseTransformation,
        );
        const maskedPattern = applyPuzzleStickering(
          orientedPattern,
          flatPuzzleStickering,
        );
        const { anchorPieceIndex, anchorOrientationIndex } =
          this.extractAnchorCoordinates(orientedPattern);
        const byOrientation = (this.solvedPatternsByAnchorCoordinates[
          anchorPieceIndex
        ] ??= {});
        byOrientation[anchorOrientationIndex] = maskedPattern;
      }
    }

    extractAnchorCoordinates(pattern: KPattern): AnchorCoordinates {
      const orbitData = pattern.patternData[this.orientationAnchor.orbitName];
      if (
        (orbitData.orientationMod?.[this.orientationAnchor.pieceIndex] ?? 0) !==
        0
      ) {
        throw new Error("Unexpected partially known orientation");
      }
      return {
        anchorPieceIndex: orbitData.pieces[this.orientationAnchor.pieceIndex],
        anchorOrientationIndex:
          orbitData.orientation[this.orientationAnchor.pieceIndex],
      };
    }

    check(
      candidateFull3x3x3Pattern: KPattern,
    ): { isSolved: false } | { isSolved: true; algToNormalize: Alg } {
      for (const cubeOrientation of cubeOrientations) {
        const reorientedCandidate =
          candidateFull3x3x3Pattern.applyTransformation(
            cubeOrientation.inverseTransformation,
          );
        const candidateMasked = applyPuzzleStickering(
          reorientedCandidate,
          this.flatPuzzleStickering,
        );
        const { anchorPieceIndex, anchorOrientationIndex } =
          this.extractAnchorCoordinates(reorientedCandidate);
        const solvedPatternByDRF =
          this.solvedPatternsByAnchorCoordinates[anchorPieceIndex][
            anchorOrientationIndex
          ];
        if (candidateMasked.isIdentical(solvedPatternByDRF)) {
          const { algToNormalize } = cubeOrientation;
          return { isSolved: true, algToNormalize };
        }
      }
      return { isSolved: false };
    }
  }

  const R = PieceStickering.Regular;
  const I = PieceStickering.Ignored;

  const F2L1: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, R, R, R, R, R, I, I, I],
      CORNERS: [I, I, I, I, R, I, I, I],
      CENTERS: [I, R, R, R, R, R],
    },
    { orbitName: "EDGES", pieceIndex: 4 },
  ];

  const F2L2A: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, R, R, R, R, R, R, I, I],
      CORNERS: [I, I, I, I, R, R, I, I],
      CENTERS: [I, R, R, R, R, R],
    },
    { orbitName: "EDGES", pieceIndex: 4 },
  ];

  const F2L2O: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, R, R, R, R, R, I, I, R],
      CORNERS: [I, I, I, I, R, I, R, I],
      CENTERS: [I, R, R, R, R, R],
    },
    { orbitName: "EDGES", pieceIndex: 4 },
  ];

  const F2L3: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, R, R, R, R, I, R, R, R],
      CORNERS: [I, I, I, I, I, R, R, R],
      CENTERS: [I, R, R, R, R, R],
    },
    { orbitName: "EDGES", pieceIndex: 4 },
  ];

  const FirstLayer: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, R, R, R, R, I, I, I, I],
      CORNERS: [I, I, I, I, R, R, R, R],
      CENTERS: [I, R, R, R, R, R],
    },
    { orbitName: "EDGES", pieceIndex: 4 },
  ];

  const Roux1L: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, I, I, I, R, I, R, I, R],
      CORNERS: [I, I, I, I, I, R, R, I],
      CENTERS: [I, R, I, I, I, I],
    },
    { orbitName: "CORNERS", pieceIndex: 5 },
  ];

  // const Roux1R: [FlatPuzzleStickering, OrientationAnchor] = [
  //   {
  //     EDGES: [I, I, I, I, I, R, I, I, R, I, R, I],
  //     CORNERS: [I, I, I, I, R, I, I, R],
  //     CENTERS: [I, I, I, R, I, I],
  //   },
  //   { orbitName: "CORNERS", pieceIndex: 4 },
  // ];

  const Roux2: [FlatPuzzleStickering, OrientationAnchor] = [
    {
      EDGES: [I, I, I, I, I, R, I, R, R, R, R, R],
      CORNERS: [I, I, I, I, R, R, R, R],
      CENTERS: [I, R, I, R, I, I],
    },
    { orbitName: "CORNERS", pieceIndex: 5 },
  ];

  const patternCheckers: PatternChecker[] = [];

  async function addSimpleStep(
    stickering: string,
    orbitName: string,
    pieceIndex: number,
    name?: string,
    obviates: string[] = [],
  ) {
    patternCheckers.push(
      new PatternChecker(
        name ?? stickering,
        Object.fromEntries(
          (
            await cubeLikePuzzleStickering(puzzleLoader, stickering)
          ).stickerings.entries(),
        ),
        {
          orbitName,
          pieceIndex,
        },
        obviates,
      ),
    );
  }

  const LSLLStuff = ["OLL", "OCLL", "EOLL", "F2L", "CLS", "ELS"];

  const XCrosses = [
    "X-Cross",
    "Double X-Cross (adjacent)",
    "Double X-Cross (opposite)",
    "Triple X-Cross",
    "First Layer",
  ];

  const RouxBlocks = ["Both Roux blocks", "1st Roux block"];

  const CFOP_Stuff = [...XCrosses, ...LSLLStuff];
  const XRoux = [...XCrosses, ...RouxBlocks];

  // Note: these are topologically sorted.
  // TODO: add "prerequisites" (e.g. EOLL for ZBLL, OLL for PLL, ELS for CLS, Roux blocks for Rouxh L10P steps, etc.)
  await addSimpleStep("full", "EDGES", 4, "Solved");
  await addSimpleStep("PLL", "EDGES", 4);
  await addSimpleStep("L6E", "EDGES", 4);
  await addSimpleStep("OLL", "EDGES", 4, undefined, [
    "ELS",
    "CLS",
    "CLL",
    "Solved",
    "L6E",
  ]);
  await addSimpleStep("OLL", "EDGES", 4);
  await addSimpleStep("OCLL", "EDGES", 4);
  await addSimpleStep("EOLL", "EDGES", 4);
  await addSimpleStep("F2L", "EDGES", 4, undefined, ["CLS"]);
  await addSimpleStep("CLS", "EDGES", 4, undefined, [
    "OLL",
    "OCLL",
    "EOLL",
    "F2L",
    "Solved",
    "L6E",
  ]);
  await addSimpleStep("ELS", "EDGES", 4, undefined, [
    "OLL",
    "OCLL",
    "EOLL",
    "F2L",
  ]);
  patternCheckers.push(new PatternChecker("Triple X-Cross", ...F2L3, XRoux));
  patternCheckers.push(new PatternChecker("F2L Slot 3", ...F2L3, XRoux));
  patternCheckers.push(
    new PatternChecker("Double X-Cross (opposite)", ...F2L2O, XRoux),
  );
  patternCheckers.push(
    new PatternChecker("Double X-Cross (adjacent)", ...F2L2A, XRoux),
  );
  patternCheckers.push(
    new PatternChecker("F2L Slot 2 (adjacent)", ...F2L2A, XRoux),
  );
  patternCheckers.push(
    new PatternChecker("F2L Slot 2 (opposite)", ...F2L2O, XRoux),
  );
  patternCheckers.push(new PatternChecker("X-Cross", ...F2L1, XRoux));
  patternCheckers.push(new PatternChecker("First Layer", ...FirstLayer, XRoux)); // TODO: this is usually obviated by 1st Roux block
  patternCheckers.push(new PatternChecker("F2L Slot 1", ...F2L1, XRoux));

  await addSimpleStep("2x2x3", "CORNERS", 6);

  // await addSimpleStep("L6EO", "CORNERS", 4, undefined, CFOP_Stuff); // TODO
  await addSimpleStep("CMLL", "CORNERS", 4, undefined, CFOP_Stuff); // TODO: AUF
  patternCheckers.push(
    new PatternChecker("Both Roux blocks", ...Roux2, [
      ...CFOP_Stuff,
      "Solved",
      "PLL",
    ]),
  );
  patternCheckers.push(
    new PatternChecker("1st Roux block", ...Roux1L, CFOP_Stuff),
  ); // TODO: detect left vs. right

  // await addSimpleStep("EOCross", "EDGES", 4); // TODO
  await addSimpleStep("Cross", "EDGES", 4, undefined, XCrosses);
  // TODO: daisy
  await addSimpleStep("2x2x2", "CORNERS", 6);
  // TODO: 1x2x2?
  // await addSimpleStep("EO", "EDGES", 0); // TODO

  const obviated = new Set<string>();

  let lastI = patternCheckers.length + 1;
  return function multiCheck(pattern: KPattern): string | null {
    for (const [i, patternChecker] of patternCheckers.entries()) {
      if (i >= lastI) {
        return null;
      }
      if (obviated.has(patternChecker.name)) {
        continue;
      }
      // if (skip.has(patternChecker.name)) {
      //   continue;
      // }
      const isSolvedInfo = patternChecker.check(pattern);
      if (isSolvedInfo.isSolved) {
        lastI = i;
        obviated.add(patternChecker.name);
        for (const newlyObviated of patternChecker.obviates) {
          obviated.add(newlyObviated);
        }
        return patternChecker.name;
      } else {
        // console.log(`[${patternChecker.name}] Unsolved`);
      }
    }

    return null;
  };

  // multiCheck(
  //   new Alg(`
  // R2 L2 F U' F B2 U L2 U2 R2 B L2 B' L2 D2 R2 F R2 B'

  // y' x U2' L2 x U2' R U R' U' R // X-Cross
  // U' R U R' L U' L' // Slot 2
  // R U' R' U' L' U' L // Slot 3 + ELS
  // `),
  // );

  async function cubeLikePuzzleStickering(
    puzzleLoader: PuzzleLoader,
    stickering: ExperimentalStickering,
  ): Promise<PuzzleStickering> {
    const kpuzzle = await puzzleLoader.kpuzzle();
    const puzzleStickering = new PuzzleStickering(kpuzzle);
    const m = new StickeringManager(kpuzzle);

    const LL = (): PieceSet => m.move("U");
    const orUD = (): PieceSet => m.or(m.moves(["U", "D"]));
    const orLR = (): PieceSet => m.or(m.moves(["L", "R"]));
    const M = (): PieceSet => m.not(orLR());

    const F2L = (): PieceSet => m.not(LL());

    const CENTERS = (): PieceSet => m.orbitPrefix("CENTER");
    const CENTER = (faceMove: string): PieceSet =>
      m.and([m.move(faceMove), CENTERS()]);
    const EDGES = (): PieceSet => m.orbitPrefix("EDGE");
    const EDGE = (faceMoves: string[]): PieceSet =>
      m.and([m.and(m.moves(faceMoves)), EDGES()]);
    const CORNERS = (): PieceSet =>
      m.or([
        m.orbitPrefix("CORNER"),
        m.orbitPrefix("C4RNER"),
        m.orbitPrefix("C5RNER"),
      ]);

    const L6E = (): PieceSet => m.or([M(), m.and([LL(), EDGES()])]);
    const centerLL = (): PieceSet => m.and([LL(), CENTERS()]);

    const edgeFR = (): PieceSet => m.and([m.and(m.moves(["F", "R"])), EDGES()]);
    // Handles Megaminx
    const cornerDFR = (): PieceSet =>
      m.and([m.and(m.moves(["F", "R"])), CORNERS(), m.not(LL())]);
    const slotFR = (): PieceSet => m.or([cornerDFR(), edgeFR()]);

    function dimF2L(): void {
      puzzleStickering.set(F2L(), PieceStickering.Dim);
    }

    function setPLL(): void {
      puzzleStickering.set(LL(), PieceStickering.PermuteNonPrimary);
      puzzleStickering.set(centerLL(), PieceStickering.Dim); // For PG
    }

    function setOLL(): void {
      puzzleStickering.set(LL(), PieceStickering.IgnoreNonPrimary);
      puzzleStickering.set(centerLL(), PieceStickering.Regular); // For PG
    }

    function dimOLL(): void {
      puzzleStickering.set(LL(), PieceStickering.Ignoriented);
      puzzleStickering.set(centerLL(), PieceStickering.Dim); // For PG
    }

    switch (stickering) {
      case "full":
        break;
      case "PLL": {
        dimF2L();
        setPLL();
        break;
      }
      case "CLS": {
        dimF2L();
        puzzleStickering.set(cornerDFR(), PieceStickering.Regular);
        puzzleStickering.set(LL(), PieceStickering.Ignoriented);
        puzzleStickering.set(m.and([LL(), CENTERS()]), PieceStickering.Dim);
        puzzleStickering.set(
          m.and([LL(), CORNERS()]),
          PieceStickering.IgnoreNonPrimary,
        );
        break;
      }
      case "OLL": {
        dimF2L();
        setOLL();
        break;
      }
      case "EOLL": {
        dimF2L();
        setOLL();
        puzzleStickering.set(m.and([LL(), CORNERS()]), PieceStickering.Ignored);
        break;
      }
      case "COLL": {
        dimF2L();
        puzzleStickering.set(
          m.and([LL(), EDGES()]),
          PieceStickering.Ignoriented,
        );
        puzzleStickering.set(m.and([LL(), CENTERS()]), PieceStickering.Dim);
        puzzleStickering.set(m.and([LL(), CORNERS()]), PieceStickering.Regular);
        break;
      }
      case "OCLL": {
        dimF2L();
        dimOLL();
        puzzleStickering.set(
          m.and([LL(), CORNERS()]),
          PieceStickering.IgnoreNonPrimary,
        );
        break;
      }
      case "CPLL": {
        dimF2L();
        puzzleStickering.set(
          m.and([CORNERS(), LL()]),
          PieceStickering.PermuteNonPrimary,
        );
        puzzleStickering.set(
          m.and([m.not(CORNERS()), LL()]),
          PieceStickering.Dim,
        );
        break;
      }
      case "CLL": {
        dimF2L();
        puzzleStickering.set(
          m.not(m.and([CORNERS(), LL()])),
          PieceStickering.Dim,
        );
        break;
      }
      case "EPLL": {
        dimF2L();
        puzzleStickering.set(LL(), PieceStickering.Dim);
        puzzleStickering.set(
          m.and([LL(), EDGES()]),
          PieceStickering.PermuteNonPrimary,
        );
        break;
      }
      case "ELL": {
        dimF2L();
        puzzleStickering.set(LL(), PieceStickering.Dim);
        puzzleStickering.set(m.and([LL(), EDGES()]), PieceStickering.Regular);
        break;
      }
      case "ELS": {
        dimF2L();
        setOLL();
        puzzleStickering.set(m.and([LL(), CORNERS()]), PieceStickering.Ignored);
        puzzleStickering.set(edgeFR(), PieceStickering.Regular);
        puzzleStickering.set(cornerDFR(), PieceStickering.Ignored);
        break;
      }
      case "LL": {
        dimF2L();
        break;
      }
      case "F2L": {
        puzzleStickering.set(LL(), PieceStickering.Ignored);
        break;
      }
      case "ZBLL": {
        dimF2L();
        puzzleStickering.set(LL(), PieceStickering.PermuteNonPrimary);
        puzzleStickering.set(centerLL(), PieceStickering.Dim); // For PG
        puzzleStickering.set(m.and([LL(), CORNERS()]), PieceStickering.Regular);
        break;
      }
      case "ZBLS": {
        dimF2L();
        puzzleStickering.set(slotFR(), PieceStickering.Regular);
        setOLL();
        puzzleStickering.set(m.and([LL(), CORNERS()]), PieceStickering.Ignored);
        break;
      }
      case "VLS": {
        dimF2L();
        puzzleStickering.set(slotFR(), PieceStickering.Regular);
        setOLL();
        break;
      }
      case "WVLS": {
        dimF2L();
        puzzleStickering.set(slotFR(), PieceStickering.Regular);
        puzzleStickering.set(
          m.and([LL(), EDGES()]),
          PieceStickering.Ignoriented,
        );
        puzzleStickering.set(m.and([LL(), CENTERS()]), PieceStickering.Dim);
        puzzleStickering.set(
          m.and([LL(), CORNERS()]),
          PieceStickering.IgnoreNonPrimary,
        );
        break;
      }
      case "LS": {
        dimF2L();
        puzzleStickering.set(slotFR(), PieceStickering.Regular);
        puzzleStickering.set(LL(), PieceStickering.Ignored);
        puzzleStickering.set(centerLL(), PieceStickering.Dim);
        break;
      }
      case "LSOLL": {
        dimF2L();
        setOLL();
        puzzleStickering.set(slotFR(), PieceStickering.Regular);
        break;
      }
      case "LSOCLL": {
        dimF2L();
        dimOLL();
        puzzleStickering.set(
          m.and([LL(), CORNERS()]),
          PieceStickering.IgnoreNonPrimary,
        );
        puzzleStickering.set(slotFR(), PieceStickering.Regular);
        break;
      }
      case "EO": {
        puzzleStickering.set(CORNERS(), PieceStickering.Ignored);
        puzzleStickering.set(
          EDGES(),
          PieceStickering.OrientationWithoutPermutation,
        );
        break;
      }
      case "EOline": {
        puzzleStickering.set(CORNERS(), PieceStickering.Ignored);
        puzzleStickering.set(
          EDGES(),
          PieceStickering.OrientationWithoutPermutation,
        );
        puzzleStickering.set(
          m.and(m.moves(["D", "M"])),
          PieceStickering.Regular,
        );
        break;
      }
      case "EOcross": {
        puzzleStickering.set(
          EDGES(),
          PieceStickering.OrientationWithoutPermutation,
        );
        puzzleStickering.set(m.move("D"), PieceStickering.Regular);
        puzzleStickering.set(CORNERS(), PieceStickering.Ignored);
        break;
      }
      case "CMLL": {
        puzzleStickering.set(F2L(), PieceStickering.Dim);
        puzzleStickering.set(L6E(), PieceStickering.Ignored);
        puzzleStickering.set(m.and([LL(), CORNERS()]), PieceStickering.Regular);
        break;
      }
      case "L10P": {
        puzzleStickering.set(m.not(L6E()), PieceStickering.Dim);
        puzzleStickering.set(m.and([CORNERS(), LL()]), PieceStickering.Regular);
        break;
      }
      case "L6E": {
        puzzleStickering.set(m.not(L6E()), PieceStickering.Dim);
        break;
      }
      case "L6EO": {
        puzzleStickering.set(m.not(L6E()), PieceStickering.Dim);
        puzzleStickering.set(
          L6E(),
          PieceStickering.ExperimentalOrientationWithoutPermutation2,
        );
        puzzleStickering.set(
          m.and([CENTERS(), orUD()]),
          PieceStickering.ExperimentalOrientationWithoutPermutation2,
        ); // For PG
        puzzleStickering.set(
          m.and([m.move("M"), m.move("E")]),
          PieceStickering.Ignored,
        );
        break;
      }
      case "Daisy": {
        puzzleStickering.set(m.all(), PieceStickering.Ignored);
        puzzleStickering.set(CENTERS(), PieceStickering.Dim);
        puzzleStickering.set(
          m.and([m.move("D"), CENTERS()]),
          PieceStickering.Regular,
        );
        puzzleStickering.set(
          m.and([m.move("U"), EDGES()]),
          PieceStickering.IgnoreNonPrimary,
        );
        break;
      }
      case "Cross": {
        puzzleStickering.set(m.all(), PieceStickering.Ignored);
        puzzleStickering.set(CENTERS(), PieceStickering.Dim);
        puzzleStickering.set(
          m.and([m.move("D"), CENTERS()]),
          PieceStickering.Regular,
        );
        puzzleStickering.set(
          m.and([m.move("D"), EDGES()]),
          PieceStickering.Regular,
        );
        break;
      }
      case "2x2x2": {
        puzzleStickering.set(
          m.or(m.moves(["U", "F", "R"])),
          PieceStickering.Ignored,
        );
        puzzleStickering.set(
          m.and([m.or(m.moves(["U", "F", "R"])), CENTERS()]),
          PieceStickering.Dim,
        );
        break;
      }
      case "2x2x3": {
        puzzleStickering.set(m.all(), PieceStickering.Dim);
        puzzleStickering.set(
          m.or(m.moves(["U", "F", "R"])),
          PieceStickering.Ignored,
        );
        puzzleStickering.set(
          m.and([m.or(m.moves(["U", "F", "R"])), CENTERS()]),
          PieceStickering.Dim,
        );
        puzzleStickering.set(
          m.and([m.move("F"), m.not(m.or(m.moves(["U", "R"])))]),
          PieceStickering.Regular,
        );
        break;
      }
      case "G1": {
        puzzleStickering.set(
          m.all(),
          PieceStickering.ExperimentalOrientationWithoutPermutation2,
        );
        puzzleStickering.set(
          m.or(m.moves(["E"])),
          PieceStickering.OrientationWithoutPermutation,
        );
        puzzleStickering.set(
          m.and(m.moves(["E", "S"])),
          PieceStickering.Ignored,
        );
        break;
      }
      case "L2C": {
        puzzleStickering.set(
          m.or(m.moves(["L", "R", "B", "D"])),
          PieceStickering.Dim,
        );
        puzzleStickering.set(m.not(CENTERS()), PieceStickering.Ignored);
        break;
      }
      case "PBL": {
        puzzleStickering.set(m.all(), PieceStickering.Ignored);
        puzzleStickering.set(
          m.or(m.moves(["U", "D"])),
          PieceStickering.PermuteNonPrimary,
        );
        break;
      }
      case "FirstBlock": {
        puzzleStickering.set(
          m.not(m.and([m.and(m.moves(["L"])), m.not(LL())])),
          PieceStickering.Ignored,
        );
        puzzleStickering.set(CENTER("R"), PieceStickering.Dim);
        break;
      }
      case "SecondBlock": {
        puzzleStickering.set(
          m.not(m.and([m.and(m.moves(["L"])), m.not(LL())])),
          PieceStickering.Ignored,
        );
        puzzleStickering.set(
          m.and([m.and(m.moves(["L"])), m.not(LL())]),
          PieceStickering.Dim,
        );
        puzzleStickering.set(
          m.and([m.and(m.moves(["R"])), m.not(LL())]),
          PieceStickering.Regular,
        );
        break;
      }
      case "EODF": {
        dimF2L();
        puzzleStickering.set(
          m.or([cornerDFR(), m.and([LL(), CORNERS()])]),
          PieceStickering.Ignored,
        );
        puzzleStickering.set(
          m.or([m.and([LL(), EDGES()]), edgeFR()]),
          PieceStickering.OrientationWithoutPermutation,
        );
        puzzleStickering.set(EDGE(["D", "F"]), PieceStickering.Regular);
        puzzleStickering.set(CENTER("F"), PieceStickering.Regular);
        break;
      }
      case "Void Cube": {
        puzzleStickering.set(CENTERS(), PieceStickering.Invisible);
        break;
      }
      case "picture":
      // fallthrough
      case "invisible": {
        puzzleStickering.set(m.all(), PieceStickering.Invisible);
        break;
      }
      case "centers-only": {
        puzzleStickering.set(m.not(CENTERS()), PieceStickering.Ignored);
        break;
      }
      case "opposite-centers": {
        puzzleStickering.set(
          m.not(m.and([CENTERS(), m.or(m.moves(["U", "D"]))])),
          PieceStickering.Ignored,
        );
        break;
      }
      default:
        console.warn(
          `Unsupported stickering for ${puzzleLoader.id}: ${stickering}. Setting all pieces to dim.`,
        );
        puzzleStickering.set(m.and(m.moves([])), PieceStickering.Dim);
    }
    return puzzleStickering;
  }
};
