import { rm } from "node:fs/promises";

export const build = async (): Promise<void> => {
  console.log("🏗️  Building Overdrip CLI...");

  const outdir = "dist";
  const targets: [Bun.Build.Target, string][] = [
    ["bun-linux-arm64", "linux-arm64"],
    ["bun-linux-x64", "linux-x86_64"],
    ["bun-darwin-arm64", "macos-arm64"],
    ["bun-darwin-x64", "macos-x86_64"],
  ];
  console.log(`  🧹 Cleaning output directory "${outdir}"...`);
  await rm(outdir, { recursive: true, force: true });

  console.log("  👨‍💻 Compiling source files...");

  for (const [bunTarget, target] of targets) {
    console.log(`    🔨 Targeting: ${target}`);
    const result = await Bun.build({
      entrypoints: ["src/index.ts"],
      outdir,
      target: "bun",
      minify: true,
      env: "inline",
      compile: {
        target: bunTarget,
        outfile: `overdrip-${target}`,
      },
    });

    if (!result.success) {
      console.error("Build failed:", result.logs);
      process.exit(1);
    }

    console.log("    ✅ Build completed successfully!");
    for (const output of result.outputs) {
      console.log(`        📦 Created: ${output.path}`);
    }
  }
};

if (import.meta.main) {
  build().catch((error) => {
    console.error("Build script failed:", error);
    process.exit(1);
  });
}
