import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    entry: "./src/index.ts",
    compilerOptions: {
      incremental: true,
      tsBuildInfoFile: "./dist/.tsbuildinfo",
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: "es2021",
  outDir: "dist",
  external: ["react", "react-dom", "wagmi", "viem", "ethers"],
  tsconfig: "./tsconfig.json",
});
