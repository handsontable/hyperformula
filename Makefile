typecheck: ## Typecheck the code
	@npm run verify:typings

setup: ## Setup project
	@npm i

compile: ## Compile to javascript
	@npm run compile

test: ## Run tests
	@npm run test

test-ci: ## Separate test configuration for CI environment
	@npm run test

check: typecheck test ## Check whether code is working correctly (types + specs)

full: check lint-fix ## Check whether code is ready to commit (types + specs + lint)

lint: ## Show linting errors
	@npm run lint

lint-fix: ## Fix linting errors
	@npm run lint:fix

doc: ## Generate documentation
	@npm run typedoc:build

servedoc: ## Run server with documentation
	@npm run typedoc:serve

clean: ## Clean compiled files
	@npm run clean

bundle:
	@npm run bundle-all

bundle-es: compile ## Transpiles files to ES
	@npm run bundle:es

bundle-commonjs: compile ## Transpiles files to CommonJS
	@npm run bundle:cjs

bundle-development: compile ## Transpiles and bundles files to UMD format (without minification)
	@npm run bundle:development

bundle-production: compile ## Transpiles and bundles files to UMD format (with minification)
	@npm run bundle:production

bundle-typings: ## Generates TypeScript declaration files
	@npm run bundle:typings

check-bundle:
	@npm run verify-bundles

verify-production-licenses:
	@npm run check:licenses

help: ## Show all make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: test doc servedoc

.DEFAULT_GOAL := help
