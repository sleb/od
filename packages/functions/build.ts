import { cp, rm } from "node:fs/promises";

const build = async (): Promise<void> => {
  console.log("🏗️  Building Overdrip functions...");

  const outdir = "lib";
  console.log(`  🧹 Cleaning output directory "${outdir}"...`);
  await rm(outdir, { recursive: true, force: true });

  console.log("  🛠️  Compiling source files...");
  const result = await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "lib",
    target: "node",
    format: "cjs",
    sourcemap: true,
    minify: false,
    env: "inline",
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    process.exit(1);
  }

  console.log("\n✅ Build completed successfully!");
  for (const output of result.outputs) {
    console.log(`  📦 Created: ${output.path}`);
  }

  console.log("\n📋 Copying `package.json`...");
  await cp("./dummy-package.json", "./lib/package.json");
  console.log("  📦 Created: lib/package.json");
};

// Run if called directly
if (import.meta.main) {
  build().catch((error) => {
    console.error("Build script failed:", error);
    process.exit(1);
  });
}
