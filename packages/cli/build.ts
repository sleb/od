import { rm } from "node:fs/promises";

const build = async (): Promise<void> => {
  console.log("🏗️  Building Overdrip CLI...");

  const outdir = "dist";
  console.log(`  🧹 Cleaning output directory "${outdir}"...`);
  await rm(outdir, { recursive: true, force: true });

  console.log("  👨‍💻 Compiling source files...");
  const result = await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir,
    target: "bun",
    sourcemap: true,
    minify: true,
    define: {
      NODE_ENV: "production",
    },
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
};

if (import.meta.main) {
  build().catch((error) => {
    console.error("Build script failed:", error);
    process.exit(1);
  });
}
