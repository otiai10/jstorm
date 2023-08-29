
clean:
	rm -rf lib release

install:
	npm install

release: clean install
	npm run build
	cp package.json lib
	cp package-lock.json lib
	cp README.md lib
	mv lib release

publish: release
	npm publish ./release
