import { Alg } from "../../Alg";
import { AlgCommon, Comparable } from "../../common";
import { IterationDirection } from "../../iteration";
import { Repetition, RepetitionInfo } from "../Repetition";
import { LeafUnit } from "../Unit";

export class CommutatorQuantum extends Comparable {
  constructor(public A: Alg, public B: Alg) {
    super();
    Object.freeze(this);
  }

  isIdentical(other: Comparable): boolean {
    const otherAsCommutatorQuantum = other as CommutatorQuantum;
    return (
      other.is(CommutatorQuantum) &&
      this.A.isIdentical(otherAsCommutatorQuantum.A) &&
      this.B.isIdentical(otherAsCommutatorQuantum.B)
    );
  }

  toString(): string {
    return `[${this.A}, ${this.B}]`;
  }

  // TODO: use a common composite iterator helper.
  *experimentalLeafUnits(
    iterDir: IterationDirection = IterationDirection.Forwards,
  ): Generator<LeafUnit> {
    if (iterDir === IterationDirection.Forwards) {
      yield* this.A.experimentalLeafUnits(IterationDirection.Forwards);
      yield* this.B.experimentalLeafUnits(IterationDirection.Forwards);
      yield* this.A.experimentalLeafUnits(IterationDirection.Backwards);
      yield* this.B.experimentalLeafUnits(IterationDirection.Backwards);
    } else {
      yield* this.B.experimentalLeafUnits(IterationDirection.Forwards);
      yield* this.A.experimentalLeafUnits(IterationDirection.Forwards);
      yield* this.B.experimentalLeafUnits(IterationDirection.Backwards);
      yield* this.A.experimentalLeafUnits(IterationDirection.Backwards);
    }
  }
}

export class Commutator extends AlgCommon<Commutator> {
  readonly #repetition: Repetition<CommutatorQuantum>;

  constructor(
    public readonly A: Alg,
    public readonly B: Alg,
    repetitionInfo: RepetitionInfo,
  ) {
    super();
    this.#repetition = new Repetition<CommutatorQuantum>(
      new CommutatorQuantum(A, B),
      repetitionInfo,
    );
  }

  /** @deprecated */
  get experimentalEffectiveAmount(): number {
    return this.#repetition.experimentalEffectiveAmount();
  }

  /** @deprecated */
  get experimentalRepetitionSuffix(): string {
    return this.#repetition.suffix();
  }

  isIdentical(other: Comparable): boolean {
    const otherAsCommutator = other as Commutator;
    return (
      other.is(Commutator) &&
      this.#repetition.isIdentical(otherAsCommutator.#repetition)
    );
  }

  inverse(): Commutator {
    return new Commutator(
      this.#repetition.quantum.B,
      this.#repetition.quantum.A,
      this.#repetition.info(),
    );
  }

  *experimentalLeafUnits(
    iterDir: IterationDirection = IterationDirection.Forwards,
  ): Generator<LeafUnit> {
    yield* this.#repetition.experimentalLeafUnits(iterDir);
  }

  toString(): string {
    return `${this.#repetition.quantum.toString()}${this.#repetition.suffix()}`;
  }

  // toJSON(): CommutatorJSON {
  //   return {
  //     type: "commutator",
  //     A: this.#quanta.quantum.A.toJSON(),
  //     B: this.#quanta.quantum.B.toJSON(),
  //     amount: this.a
  //   };
  // }
}
