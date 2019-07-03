import {terser} from "rollup-plugin-terser";
import * as typescript from "typescript"
import pegjs from "rollup-plugin-pegjs";
import resolve from "rollup-plugin-node-resolve";
import typescript2 from "rollup-plugin-typescript2"
import tslint from "rollup-plugin-tslint";

const plugins = [
  pegjs(),
  tslint({
    exclude: [
      "node_modules/**",
      "src/**/parser-source/parser-source.js",
      "src/**/parser-source/parser-source.pegjs"
    ]
  }),
  typescript2({
    typescript: typescript,
  })
]

if (!process.env.ROLLUP_WATCH) {
  plugins.push(terser())
}

const esm = {
  input: {
    "alg": "src/alg/index.ts",
    "bluetooth": "src/bluetooth/index.ts",
    "cubing": "src/cubing/index.ts",
    "kpuzzle": "src/kpuzzle/index.ts",
    "puzzle-geometry": "src/puzzle-geometry/index.ts",
    "twisty": "src/twisty/index.ts"
  },
  output: [
    {
      dir: "dist/esm",
      format: "esm",
      sourcemap: true
    }
  ],
  external: ["three"],
  plugins
}

const umd = {
  input: "src/cubing/index.ts",
  output: [
    {
      file: "dist/umd/cubing.umd.js",
      format: "umd",
      name: "cubing"
    }
  ],
  plugins: [
    ...plugins,
    resolve({
      only: ["three"]
    })
  ]
}

const configs = [umd]
if (!process.env.ROLLUP_WATCH) {
  configs.push(esm)
}

export default configs;
