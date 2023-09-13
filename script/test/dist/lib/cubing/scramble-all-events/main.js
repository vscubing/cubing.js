import { needFolder } from "../../../../../lib/need-folder.js";

needFolder(
  new URL("../../../../../../dist/lib/cubing/scramble", import.meta.url)
    .pathname,
  "make build-lib-js",
);

import("./test.js");
