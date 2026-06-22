// Stage a clean package manifest into lib/ for publishing.
//
// We publish the *contents* of lib/ as the package root (via
// package.json "publishConfig.directory": "lib"), so the entry points
// (main: "index.js", etc.) resolve flat — exactly as 0.17.0 did. pnpm
// requires the published directory to contain its own package.json, so we
// copy the root manifest here, dropping fields that are dev/build-only or
// that would re-trigger the publish redirection.
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

for (const field of ["publishConfig", "devDependencies", "scripts", "targets", "pnpm"]) {
    delete pkg[field];
}

const out = path.join(root, "lib", "package.json");
fs.writeFileSync(out, JSON.stringify(pkg, null, 2) + "\n");
console.log(`staged lib/package.json (jstorm@${pkg.version})`);
