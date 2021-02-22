// TODO: move this file somewhere permanent.
import {
  Alg,
  Bunch,
  Comment,
  Commutator,
  Conjugate,
  Move,
  Newline,
  Pause,
  TraversalUp,
} from "../../alg/index";

/*
 *   For movecount, that understands puzzle rotations.  This code
 *   should be moved to the alg class, probably.
 */
class MoveCounter extends TraversalUp<number, number> {
  constructor(private metric: (move: Move) => number) {
    super();
  }

  public traverseAlg(alg: Alg): number {
    let r = 0;
    for (const unit of alg.units()) {
      r += this.traverseUnit(unit);
    }
    return r;
  }

  public traverseBunch(bunch: Bunch): number {
    return (
      this.traverseUnit(bunch.experimentalAlg) *
      Math.abs(bunch.experimentalEffectiveAmount)
    );
  }

  public traverseMove(move: Move): number {
    return this.metric(move);
  }

  public traverseCommutator(commutator: Commutator): number {
    return (
      Math.abs(commutator.experimentalEffectiveAmount) *
      2 *
      (this.traverseAlg(commutator.A) + this.traverseAlg(commutator.B))
    );
  }

  public traverseConjugate(conjugate: Conjugate): number {
    return (
      Math.abs(conjugate.experimentalEffectiveAmount) *
      (2 * this.traverseAlg(conjugate.A) + this.traverseAlg(conjugate.B))
    );
  }

  // TODO: Remove spaces between repeated pauses (in traverseSequence)
  public traversePause(_pause: Pause): number {
    return 0;
  }

  public traverseNewline(_newLine: Newline): number {
    return 0;
  }

  // TODO: Enforce being followed by a newline (or the end of the alg)?
  public traverseComment(_comment: Comment): number {
    return 0;
  }
}

function isCharUppercase(c: string): boolean {
  return "A" <= c && c <= "Z";
}

function baseMetric(move: Move): number {
  const fam = move.family;
  if (
    (isCharUppercase(fam[0]) && fam[fam.length - 1] === "v") ||
    fam === "x" ||
    fam === "y" ||
    fam === "z"
  ) {
    return 0;
  } else {
    return 1;
  }
}

const baseCounter = new MoveCounter(baseMetric);
export const countMoves = baseCounter.traverseAlg.bind(baseCounter);
