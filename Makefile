typecheck: ## Typecheck the code
	@yarn tsc --noEmit

setup:
	@yarn install

compile: ## Compile to javascript
	@yarn tsc

regenerate-parser:
	@yarn jison src/parser/parser.jison --outfile src/parser/parser.js

check-parser-generation:
	@yarn jison src/parser/parser.jison --outfile /tmp/parser.js
	# Diff will end with exit code different than 0 if files differ
	@diff src/parser/parser.js /tmp/parser.js > /dev/null

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
