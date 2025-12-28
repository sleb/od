#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";

export const build = async () => {
  const formatFileSize = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  console.log("\n🚀 Starting build process...\n");

  const outdir = "dist";

  if (existsSync(outdir)) {
    console.log(`🗑️ Cleaning previous build at ${outdir}`);
    await rm(outdir, { recursive: true, force: true });
  }

  const start = performance.now();

  const result = await Bun.build({
    entrypoints: ["src/index.html"],
    outdir,
    plugins: [plugin],
    minify: true,
    target: "browser",
    sourcemap: "linked",
  });

  const end = performance.now();

  if (!result.success) {
    throw new Error("Build failed");
  }

  const outputTable = result.outputs.map((output) => ({
    File: path.relative(process.cwd(), output.path),
    Type: output.kind,
    Size: formatFileSize(output.size),
  }));

  console.table(outputTable);
  const buildTime = (end - start).toFixed(2);

  console.log(`\n✅ Build completed in ${buildTime}ms\n`);
};

if (import.meta.main) {
  build().catch((err) => {
    console.error("❌ Build failed:", err);
    process.exit(1);
  });
}
