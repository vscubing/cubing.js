import { Alg } from "./Alg";
import { AlgBuilder } from "./AlgBuilder";
import { Grouping } from "./units/containers/Grouping";
import { Commutator } from "./units/containers/Commutator";
import { Conjugate } from "./units/containers/Conjugate";
import { Turn, QuantumTurn } from "./units/leaves/Turn";
import { Newline } from "./units/leaves/Newline";
import { Pause } from "./units/leaves/Pause";
import { RepetitionInfo } from "./units/Repetition";
import { LineComment } from "./units/leaves/LineComment";

type StoppingChar = "," | ":" | "]" | ")";

function parseIntWithEmptyFallback<T>(n: string, emptyFallback: T): number | T {
  return n ? parseInt(n) : emptyFallback;
}

const repetitionRegex = /^(\d+)?('?)/;
const moveStartRegex = /^[_\dA-Za-z]/;
const moveQuantumRegex = /^((([1-9]\d*)-)?([1-9]\d*))?([_A-Za-z]+)?/;
const commentTextRegex = /[^\n]*/;

export function parseAlg(s: string): Alg {
  return new AlgParser().parseAlg(s);
}

export function parseMove(s: string): Turn {
  return new AlgParser().parseMove(s);
}

export function parseMoveQuantum(s: string): QuantumTurn {
  return new AlgParser().parseMoveQuantum(s);
}

// TODO: support recording string locations for moves.
class AlgParser {
  #input: string = "";
  #idx: number = 0;

  parseAlg(input: string): Alg {
    this.#input = input;
    this.#idx = 0;
    const alg = this.parseAlgWithStopping([]);
    this.mustBeAtEndOfInput();
    return alg;
  }

  parseMove(input: string): Turn {
    this.#input = input;
    this.#idx = 0;
    const move = this.parseMoveImpl();
    this.mustBeAtEndOfInput();
    return move;
  }

  parseMoveQuantum(input: string): QuantumTurn {
    this.#input = input;
    this.#idx = 0;
    const moveQuantum = this.parseMoveQuantumImpl();
    this.mustBeAtEndOfInput();
    return moveQuantum;
  }

  private mustBeAtEndOfInput() {
    if (this.#idx !== this.#input.length) {
      throw new Error("parsing unexpectedly ended early");
    }
  }

  private parseAlgWithStopping(stopBefore: StoppingChar[]): Alg {
    const algBuilder = new AlgBuilder();

    // We're "crowded" if there was not a space or newline since the last unit.
    let crowded = false;

    const mustNotBeCrowded = (): void => {
      if (crowded) {
        throw new Error(
          `Unexpected unit at idx ${this.#idx}. Are you missing a space?`,
        ); // TODO better error message
      }
    };

    mainLoop: while (this.#idx < this.#input.length) {
      if ((stopBefore as string[]).includes(this.#input[this.#idx])) {
        return algBuilder.toAlg();
      }
      if (this.tryConsumeNext(" ")) {
        crowded = false;
        continue mainLoop;
      } else if (moveStartRegex.test(this.#input[this.#idx])) {
        mustNotBeCrowded();
        const move = this.parseMoveImpl();
        algBuilder.push(move);
        crowded = true;
        continue mainLoop;
      } else if (this.tryConsumeNext("(")) {
        mustNotBeCrowded();
        const alg = this.parseAlgWithStopping([")"]);
        this.mustConsumeNext(")");
        const repetitionInfo = this.parseRepetition();
        algBuilder.push(new Grouping(alg, repetitionInfo));
        crowded = true;
        continue mainLoop;
      } else if (this.tryConsumeNext("[")) {
        mustNotBeCrowded();
        const A = this.parseAlgWithStopping([",", ":"]);
        const separator = this.popNext();
        const B = this.parseAlgWithStopping(["]"]);
        this.mustConsumeNext("]");
        const repetitionInfo = this.parseRepetition();
        switch (separator) {
          case ":":
            algBuilder.push(new Conjugate(A, B, repetitionInfo));
            crowded = true;
            continue mainLoop;
          case ",":
            algBuilder.push(new Commutator(A, B, repetitionInfo));
            crowded = true;
            continue mainLoop;
          default:
            throw "unexpected parsing error";
        }
      } else if (this.tryConsumeNext("\n")) {
        algBuilder.push(new Newline());
        crowded = false;
        continue mainLoop;
      } else if (this.tryConsumeNext("/")) {
        this.mustConsumeNext("/");
        const [text] = this.parseRegex(commentTextRegex);
        algBuilder.push(new LineComment(text));
        crowded = false;
        continue mainLoop;
      } else if (this.tryConsumeNext(".")) {
        mustNotBeCrowded();
        algBuilder.push(new Pause());
        while (this.tryConsumeNext(".")) {
          algBuilder.push(new Pause());
        }
        crowded = true;
        continue mainLoop;
      } else {
        console.log(this.#input, this.#idx);
        throw new Error(`Unexpected character: ${this.popNext()}`);
      }
    }

    if (this.#idx !== this.#input.length) {
      throw new Error("did not finish parsing?");
    }
    if (stopBefore.length > 0) {
      throw new Error("expected stopping");
    }
    return algBuilder.toAlg();
  }

  private parseMoveQuantumImpl(): QuantumTurn {
    const [, , , outerLayerStr, innerLayerStr, family] = this.parseRegex(
      moveQuantumRegex,
    );

    return new QuantumTurn(
      family,
      parseIntWithEmptyFallback(innerLayerStr, undefined),
      parseIntWithEmptyFallback(outerLayerStr, undefined),
    );
  }

  private parseMoveImpl(): Turn {
    const moveQuantum = this.parseMoveQuantumImpl();
    const repetitionInfo = this.parseRepetition();

    const move = new Turn(moveQuantum, repetitionInfo);
    return move;
  }

  private parseRepetition(): RepetitionInfo {
    const [, absAmountStr, primeStr] = this.parseRegex(repetitionRegex);
    return [parseIntWithEmptyFallback(absAmountStr, null), primeStr === "'"];
  }

  private parseRegex(regex: RegExp): RegExpExecArray {
    const arr = regex.exec(this.remaining());
    if (arr === null) {
      throw new Error("internal parsing error"); // TODO
    }
    this.#idx += arr[0].length;
    return arr;
  }

  private remaining(): string {
    return this.#input.slice(this.#idx);
  }

  private popNext(): string {
    const next = this.#input[this.#idx];
    this.#idx++;
    return next;
  }

  private tryConsumeNext(expected: string): boolean {
    if (this.#input[this.#idx] === expected) {
      this.#idx++;
      return true;
    }
    return false;
  }

  private mustConsumeNext(expected: string): string {
    const next = this.popNext();
    if (next !== expected) {
      throw new Error(
        `expected \`${expected}\` while parsing, encountered ${next}`,
      ); // TODO: be more helpful
    }
    return next;
  }
}