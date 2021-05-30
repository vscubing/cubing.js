import { AlgEditor, TwistyPlayer } from "../../../cubing/twisty";

const alg = `F U2 L2 B2 F' U L2 U R2 D2 L' B L2 B' R2 U2

y x' // inspection
U R2 U' F' L F' U' L' // XX-Cross + EO
U' R U R' // 3rd slot
R' U R U2' R' U R // 4th slot
U R' U' R U' R' U2 R // OLL / ZBLL
U // AUF

// from http://cubesolv.es/solve/5757`;
const twistyPlayer = document.body.appendChild(new TwistyPlayer({}));
twistyPlayer.id = "plplpl";

const algEditor = new AlgEditor({});
algEditor.setAttribute("for-twisty-player", "plplpl");
algEditor.algString = alg;
document.body.appendChild(algEditor);
