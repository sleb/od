import { rm } from "node:fs/promises";

const build = async (): Promise<void> => {
  console.log("🏗️  Building Overdrip CLI...");

  const outdir = "dist";
  const targets: Bun.Build.Target[] = ["bun-linux-arm64", "bun-darwin-arm64"];
  console.log(`  🧹 Cleaning output directory "${outdir}"...`);
  await rm(outdir, { recursive: true, force: true });

  console.log("  👨‍💻 Compiling source files...");

  for (const target of targets) {
    console.log(`    🔨 Targeting: ${target}`);
    const result = await Bun.build({
      entrypoints: ["src/index.ts"],
      outdir: `${outdir}/${target}`,
      target: "bun",
      minify: true,
      env: "inline",
      compile: {
        target,
        outfile: "overdrip",
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
