import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import { version } from "./package.json";

const year = new Date().getFullYear();

const banner =
  `//fhook - v${version} - ` +
  "https://github.com/Ain477/fhook\n" +
  `//Al-Amin Islam Nerob <alamin@aincoder.com> - ` +
  `MIT Copyright ${year}`;

const baseIifeConfig = {
  banner,
  format: "iife",
  name: "fhook",
  sourcemap: true,
};

export default defineConfig({
  input: "src/main.js",
  output: [
    {
      ...baseIifeConfig,
      file: "dist/fhook.js",
    },
    {
      ...baseIifeConfig,
      file: "dist/fhook.min.js",
      plugins: [
        terser({
          format: {
            comments: /^(fhook|AinCoder)/,
          },
        }),
      ],
    },
    {
      dir: "lib",
      format: "cjs",
      exports: "auto",
    },
    {
      dir: "es",
      format: "esm",
    },
  ],
  plugins: [typescript()],
});
