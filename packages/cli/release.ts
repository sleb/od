#!/usr/bin/env bun

import { $ } from "bun";
import { version } from "../../package.json";

const assets = [
  "dist/overdrip-linux-arm64",
  "dist/overdrip-linux-x86_64",
  "dist/overdrip-macos-arm64",
  "dist/overdrip-macos-x86_64",
];

const ensureGh = async () => {
  try {
    await $`gh --version`;
  } catch {
    throw new Error(
      "gh CLI not found; install from https://cli.github.com and auth with `gh auth login`",
    );
  }
};

const ensureAssets = async () => {
  for (const asset of assets) {
    const exists = await Bun.file(asset).exists();
    if (!exists) {
      throw new Error(
        `Missing asset: ${asset} (build first with: bun run build)`,
      );
    }
    await $`chmod +x ${asset}`;
  }
};

const compressAssets = async () => {
  console.log("Compressing binaries...");
  for (const asset of assets) {
    await $`gzip -9 -k -f ${asset}`;
    console.log(`  Compressed ${asset}`);
  }
};

const main = async () => {
  if (!version) {
    console.error("Version not found in package.json");
    process.exit(1);
  }

  await ensureGh();
  await ensureAssets();
  await compressAssets();

  const gzippedAssets = assets.map((a) => `${a}.gz`);

  await $`gh release create ${version} ${gzippedAssets} --title ${version} --notes ${`Overdrip CLI ${version}`} --latest`;
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
