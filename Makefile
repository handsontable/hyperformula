typecheck: ## Typecheck the code
	@yarn tsc --noEmit

setup: ## Setup project
	@yarn install

compile: ## Compile to javascript
	@yarn tsc

test: ## Run tests
	@yarn jest

test-ci: ## Separate test configuration for CI environment
	@yarn jest --maxWorkers=2

check: typecheck test ## Check whether code is working correctly (types + specs)

full: check lint-fix ## Check whether code is ready to commit (types + specs + lint)

lint: ## Show linting errors
	@yarn tslint --project tsconfig.json

lint-fix: ## Fix linting errors
	@yarn tslint --fix --project tsconfig.json > /dev/null

coverage: ## Run tests and show coverage
	@yarn jest --coverage

doc: ## Generate documentation
	@yarn typedoc --options .typedoc.js

servedoc: ## Run server with documentation
	@yarn http-server doc -p 5005

clean: ## Clean compiled files
	@rm -rf lib/ es/ commonjs/ dist/ typings/

bundle: compile bundle-es bundle-commonjs bundle-development bundle-production bundle-typings check-bundle ## Bundle library by making CommonJS, ES and UMD compatible files

bundle-es: compile ## Transpiles files to ES
	@yarn cross-env-shell BABEL_ENV=es env-cmd -f ./ht.config.js babel lib --out-dir es

bundle-commonjs: compile ## Transpiles files to CommonJS
	@yarn cross-env-shell BABEL_ENV=commonjs env-cmd -f ./ht.config.js babel lib --out-dir commonjs

bundle-development: compile ## Transpiles and bundles files to UMD format (without minification)
	@yarn cross-env-shell BABEL_ENV=commonjs NODE_ENV=development env-cmd -f ./ht.config.js webpack ./lib/index.js

bundle-production: compile ## Transpiles and bundles files to UMD format (with minification)
	@yarn cross-env-shell BABEL_ENV=commonjs NODE_ENV=production env-cmd -f ./ht.config.js webpack ./lib/index.js

bundle-typings: ## Generates TypeScript declaration files
	@yarn tsc --emitDeclarationOnly -d --outDir typings

check-bundle:
	@node script/check-file.js dist/hyperformula.js
	@node script/check-file.js dist/hyperformula.min.js
	@node script/check-file.js dist/hyperformula.full.js
	@node script/check-file.js dist/hyperformula.full.min.js
	@node script/check-file.js commonjs

verify-production-licenses:
	@yarn license-checker --production --excludePackages="hyperformula@0.0.1" --onlyAllow="MIT; Apache-2.0; BSD-3-Clause; BSD-2-Clause; ISC; BSD; Unlicense"

help: ## Show all make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: test coverage benchmark doc servedoc

.DEFAULT_GOAL := help
