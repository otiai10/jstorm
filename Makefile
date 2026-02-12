
clean:
	rm -rf lib release

install:
	pnpm install

release: clean install
	pnpm run build
	cp package.json      lib
	cp pnpm-lock.yaml    lib
	cp README.md         lib
	mv lib release

publish: release
	pnpm publish ./release
