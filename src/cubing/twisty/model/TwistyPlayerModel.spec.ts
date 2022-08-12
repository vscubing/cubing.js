import { expect } from "../../../test/chai-workaround";
import { Alg, Move, Pause } from "../../alg";
import { TwistyPlayerModel } from "./TwistyPlayerModel";

it("generates Twizzle links", async () => {
  const twistyPlayerModel = new TwistyPlayerModel();
  expect(await twistyPlayerModel.twizzleLink()).to.equal(
    "https://alpha.twizzle.net/edit/",
  );
  twistyPlayerModel.alg.set("R U R'");
  expect(await twistyPlayerModel.twizzleLink()).to.equal(
    "https://alpha.twizzle.net/edit/?alg=R+U+R%27",
  );
  twistyPlayerModel.puzzleIDRequest.set("4x4x4");
  expect(await twistyPlayerModel.twizzleLink()).to.equal(
    "https://alpha.twizzle.net/edit/?alg=R+U+R%27&puzzle=4x4x4",
  );
});

it("adds alg leaves and moves properly", async () => {
  const twistyPlayerModel = new TwistyPlayerModel();
  twistyPlayerModel.alg.set("R U R'");

  twistyPlayerModel.experimentalAddAlgLeaf(new Move("D2"));
  expect(
    (await twistyPlayerModel.alg.get()).alg.isIdentical(new Alg("R U R' D2")),
  ).to.be.true;

  // This should be the same as `.experimentalAddAlgLeaf()`;
  twistyPlayerModel.experimentalAddMove(new Move("F'"));
  expect(
    (await twistyPlayerModel.alg.get()).alg.isIdentical(
      new Alg("R U R' D2 F'"),
    ),
  ).to.be.true;

  twistyPlayerModel.experimentalAddMove(new Move("F2"), {
    coalesce: true,
  });
  expect(
    (await twistyPlayerModel.alg.get()).alg.isIdentical(new Alg("R U R' D2 F")),
  ).to.be.true;

  twistyPlayerModel.experimentalAddAlgLeaf(new Pause());
  expect(
    (await twistyPlayerModel.alg.get()).alg.isIdentical(
      new Alg("R U R' D2 F ."),
    ),
  ).to.be.true;
});