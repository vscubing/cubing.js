import { cssStyleSheetShim } from "./node-custom-element-shims";

export const twistyAlgViewerCSS = new cssStyleSheetShim();
twistyAlgViewerCSS.replaceSync(
  `
:host {
  display: inline;
}

.wrapper {
  display: inline;
}

a {
  color: inherit;
  text-decoration: none;
  margin-left: -0.1em;
  margin-right: -0.1em;
  padding-left: 0.1em;
  padding-right: 0.1em;
  border-radius: 0.1em;
}

twisty-alg-leaf-elem.twisty-alg-comment {
  color: rgba(0, 0, 0, 0.4);
}

.current-move a {
  background: #7272CB;
}

@media(hover: hover) {
  a:hover {
    background: #7272CB;
  }
}

a:active {
  background: #565698;
}

.twisty-alg-line-comment__span {
  color: grey;
}

`,
);
