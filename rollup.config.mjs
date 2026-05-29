import { createRequire } from "module";
import clear from "rollup-plugin-clear";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import screeps from "rollup-plugin-screeps";
import copy from "rollup-plugin-copy";

const require = createRequire(import.meta.url);

let config;
const dest = process.env.DEST;
if (!dest) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if ((config = require("./screeps.json")[dest]) == null) {
  throw new Error("Invalid upload destination");
}

const pluginDeploy =
  config && config.copyPath
    ? // 复制到指定路径
      copy({
        targets: [
          {
            src: "dist/main.js",
            dest: config.copyPath
          },
          {
            src: "dist/main.js.map",
            dest: config.copyPath,
            rename: name => name + ".map.js",
            transform: contents => `module.exports = ${contents.toString()};`
          }
        ],
        hook: "writeBundle",
        verbose: true
      })
    : // 更新 .map 到 .map.js 并上传
      screeps({ config, dryRun: !config });

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: true
  },

  plugins: [
    clear({ targets: ["dist"] }),
    resolve({ rootDir: "src" }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    pluginDeploy
  ]
};
