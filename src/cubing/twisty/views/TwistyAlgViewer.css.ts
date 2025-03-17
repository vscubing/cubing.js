import { CSSSource } from "./ManagedCustomElement";

export const twistyAlgViewerCSS = new CSSSource(
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
