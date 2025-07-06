import type { ExperimentalSerializationOptions } from "@vscubing/cubing/alg/SerializationOptions";
import { AlgCommon, type Comparable } from "../../common";
import { IterationDirection } from "../../iteration";
import type { AlgLeaf } from "../AlgNode";

/** @category Alg Nodes */
export class Newline extends AlgCommon<Newline> {
  toString(
    _experimentalSerializationOptions?: ExperimentalSerializationOptions,
  ): string {
    return "\n";
  }

  isIdentical(other: Comparable): boolean {
    return other.is(Newline);
  }

  invert(): Newline {
    return this;
  }

  *experimentalExpand(
    _iterDir: IterationDirection = IterationDirection.Forwards,
    _depth: number = Infinity,
  ): Generator<AlgLeaf> {
    yield this;
  }
}
