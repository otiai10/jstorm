
clean:
	rm -rf lib release

install:
	pnpm install

# build:lib compiles into lib/ and stages a clean lib/package.json + README
# (see scripts/stage-manifest.js). Publishing uses package.json
# "publishConfig.directory": "lib", so `pnpm publish` ships the contents of
# lib/ as the package root (flat layout, same as <=0.17.0). No release/ copy.
release: clean install
	pnpm run build:lib

publish: release
	pnpm publish
