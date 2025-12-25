#!/usr/bin/env bun

import { $ } from "bun";
import { parseArgs } from "util";
import { file, write } from "bun";
import { build } from "./build";


const ReleaseTypes = ["major", "minor", "patch", "development"] as const;
type ReleaseType = typeof ReleaseTypes[number];

const assets = [
  "dist/overdrip-linux-arm64",
  "dist/overdrip-linux-x86_64",
  "dist/overdrip-macos-arm64",
  "dist/overdrip-macos-x86_64",
];

const parseCliArgs = (): { releaseType: ReleaseType } => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "release-type": {
        type: "string",
        default: "development",
      },
    },
    strict: true,
  });

  const releaseType = values["release-type"] as ReleaseType;
  if (!ReleaseTypes.includes(releaseType)) {
    throw new Error(
      `Invalid release type: ${releaseType}. Must be one of: ${ReleaseTypes.join(
        ", ",
      )}`,
    );
  }

  return { releaseType };
};

const ensureGh = async () => {
  try {
    await $`gh --version`.quiet();
  } catch {
    throw new Error(
      "gh CLI not found; install from https://cli.github.com and auth with `gh auth login`",
    );
  }
};

const ensureAssets = async () => {
  for (const asset of assets) {
    const exists = await file(asset).exists();
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

const getCurrentBranch = async (): Promise<string> => {
  const result = await $`git rev-parse --abbrev-ref HEAD`.text();
  return result.trim();
};

const hasUncommittedChanges = async (): Promise<boolean> => {
  const result = await $`git status --porcelain`.text();
  return result.trim().length > 0;
};

const hasUnpushedCommits = async (): Promise<boolean> => {
  try {
    const result = await $`git log @{u}..`.text();
    return result.trim().length > 0;
  } catch {
    // If there's no upstream, consider it as unpushed
    return true;
  }
};

const getShortCommitHash = async (): Promise<string> => {
  const result = await $`git rev-parse --short HEAD`.text();
  return result.trim();
};

const checkGitState = async () => {
  const branch = await getCurrentBranch();
  if (branch !== "main") {
    throw new Error(
      `Must be on 'main' branch to release (currently on '${branch}')`,
    );
  }

  if (await hasUncommittedChanges()) {
    throw new Error("Cannot release with uncommitted changes");
  }

  if (await hasUnpushedCommits()) {
    throw new Error("Cannot release with unpushed commits");
  }
};

type ReleaseTuple = [number, number, number];
const parseVersion = (version: string): ReleaseTuple => {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return [parts[0]!, parts[1]!, parts[2]!];
}

const bumpVersion = (
  currentVersion: string,
  releaseType: Omit<ReleaseType, "development">,
): string => {
  const [major, minor, patch] = parseVersion(currentVersion);

  switch (releaseType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unsupported release type: ${releaseType}`);
  }
};

const getRootPackageJson = async () => {
  const rootPackagePath = "../../package.json";
  const content = await file(rootPackagePath).text();
  return { path: rootPackagePath, data: JSON.parse(content) };
};

const updateVersion = async (newVersion: string) => {
  const { path: packagePath, data: packageJson } = await getRootPackageJson();
  packageJson.version = newVersion;
  await write(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
  console.log(`Updated version to ${newVersion} in ${packagePath}`);
};

const commitAndPushVersion = async (newVersion: string) => {
  await $`git add ../../package.json`;
  await $`git commit -m ${"chore: bump version to " + newVersion}`;
  await $`git push`;
  console.log(`Committed and pushed version ${newVersion}`);
};

const confirmRelease = async (version: string, releaseType: string): Promise<boolean> => {
  console.log(`\nCreate ${releaseType} release ${version}?`);
  console.write("Type 'yes' to confirm: ");

  for await (const line of console) {
    const answer = line.trim().toLowerCase();
    return answer === "yes";
  }

  return false;
};

const main = async () => {
  const { releaseType } = parseCliArgs();

  await ensureGh();
  await checkGitState();
  await build();
  await ensureAssets();

  let version: string;
  let releaseNotes: string;

  if (releaseType === "development") {
    const commitHash = await getShortCommitHash();
    version = `dev-${commitHash}`;
    releaseNotes = `Development snapshot from commit ${commitHash}`;
    console.log(`Creating development release: ${version}`);
  } else {
    const { data: packageJson } = await getRootPackageJson();
    const currentVersion = packageJson.version;
    if (!currentVersion) {
      throw new Error("Version not found in root package.json");
    }

    const newVersion = bumpVersion(currentVersion, releaseType);

    const confirmed = await confirmRelease(newVersion, releaseType);
    if (!confirmed) {
      console.log("Release cancelled");
      process.exit(0);
    }

    await updateVersion(newVersion);
    await commitAndPushVersion(newVersion);

    version = newVersion;
    releaseNotes = `Overdrip CLI ${newVersion}`;
  }

  await compressAssets();

  const gzippedAssets = assets.map((a) => `${a}.gz`);

  const releaseArgs = [
    "release",
    "create",
    version,
    ...gzippedAssets,
    "--title",
    version,
    "--notes",
    releaseNotes,
  ];

  if (releaseType !== "development") {
    releaseArgs.push("--latest");
  } else {
    releaseArgs.push("--prerelease");
  }

  await $`gh ${releaseArgs}`;
  console.log(`✓ Release ${version} created successfully`);
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
