import { esbuildPlugin } from "@web/dev-server-esbuild";
import { chromeLauncher } from "@web/test-runner-chrome";

export default {
  files: ["src/**/*.spec.dom.ts"],
  plugins: [esbuildPlugin({ ts: true })],
  nodeResolve: true,
  coverageConfig: {
    reportDir: ".temp/coverage",
  },
  browsers: [
    chromeLauncher({
      launchOptions: {
        executablePath: "/usr/bin/google-chrome",
      },
    }),
  ],
};
