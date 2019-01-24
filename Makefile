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

benchmark-ci: ## Run CI benchmarks
	@yarn ts-node benchmark/circle.ts

benchmark: ## Run benchmarks
	@yarn ts-node benchmark/stage-1.ts

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
	@rm -rf lib/

bundle: compile
	@yarn webpack --config webpack.config.js

check-bundle:
	@node script/check-minified.js
	@ls -sS1h lib/ | grep bundle.js

help: ## Show all make commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: test coverage benchmark doc servedoc

.DEFAULT_GOAL := help
