#!/usr/bin/env node
// One-shot local release: bump version -> build -> publish (from repo root,
// flat via publishConfig.directory) -> push the commit + tag.
//
//   pnpm release              # patch (default)
//   pnpm release minor
//   pnpm release major
//   pnpm release 1.2.3        # explicit version
//   pnpm release minor --dry-run
//   pnpm release patch --otp=123456
//
// Publishing happens LOCALLY (npm login + 2FA OTP). We deliberately do not
// publish from CI, so no long-lived npm token is stored in GitHub Secrets.
// Trade-off: locally published versions do not carry npm provenance.

const { spawnSync } = require("child_process");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const otpArg = args.find((a) => a.startsWith("--otp="));
const bump = args.find((a) => !a.startsWith("-")) || "patch";

const KEYWORDS = new Set([
    "patch", "minor", "major",
    "prepatch", "preminor", "premajor", "prerelease",
]);
if (!KEYWORDS.has(bump) && !/^\d+\.\d+\.\d+([-.].+)?$/.test(bump)) {
    console.error(
        `Invalid version/bump: "${bump}"\n` +
        `Usage: pnpm release <patch|minor|major|x.y.z> [--otp=######] [--dry-run]`
    );
    process.exit(1);
}

// No shell: each step is spawned with an explicit argument array, so values
// like the bump type or OTP cannot be interpreted as shell metacharacters.
function run(file, fileArgs) {
    console.log(`$ ${file} ${fileArgs.join(" ")}`);
    if (dryRun) return;
    const res = spawnSync(file, fileArgs, { stdio: "inherit" });
    if (res.error) { console.error(res.error.message); process.exit(1); }
    if (res.status !== 0) process.exit(res.status ?? 1);
}

// 1. Bump version: commits and tags vX.Y.Z. Aborts if the working tree is dirty.
run("npm", ["version", bump]);
// 2. Build + stage lib/ for publishing. MUST run after the bump so the staged
//    lib/package.json carries the new version.
run("pnpm", ["run", "build:lib"]);
// 3. Publish the flat package from the repo root (2FA OTP prompt unless --otp given).
run("pnpm", ["publish", ...(otpArg ? [otpArg] : [])]);
// 4. Push the release commit and tag.
run("git", ["push", "--follow-tags"]);

console.log(dryRun ? "\n[dry-run] no changes were made." : "\n✓ released.");
