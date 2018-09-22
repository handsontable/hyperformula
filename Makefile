typecheck: ## Typecheck the code
	@yarn tsc --noEmit

compile: ## Compile to javascript
	@yarn tsc

test: ## Run tests
	@yarn jest

coverage: ## Run tests and show coverage
	@yarn jest --coverage

clean: ## Clean compiled files
	@rm -rf lib/

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: test

.DEFAULT_GOAL := help
