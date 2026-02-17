#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HYPERFORMULA_TESTS_DIR="$SCRIPT_DIR/hyperformula-tests"

# 1. Check if hyperformula-tests exists
if [ ! -d "$HYPERFORMULA_TESTS_DIR" ]; then
  echo "Cloning hyperformula-tests..."
  if [ -n "$DEPLOY_TOKEN" ]; then
    git clone "https://x-access-token:${DEPLOY_TOKEN}@github.com/handsontable/hyperformula-tests.git" "$HYPERFORMULA_TESTS_DIR"
  else
    git clone git@github.com:handsontable/hyperformula-tests.git "$HYPERFORMULA_TESTS_DIR"
  fi
fi

# 2. Get current branch from root repo
cd "$REPO_ROOT"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Checking out branch $CURRENT_BRANCH in hyperformula-tests..."

# 3. Checkout matching branch in hyperformula-tests or fall back to main
cd "$HYPERFORMULA_TESTS_DIR"

if git show-ref --verify --quiet "refs/heads/$CURRENT_BRANCH"; then
  git checkout "$CURRENT_BRANCH"
else
  git checkout master
fi

# 4. Pull changes from origin
git pull origin "$(git rev-parse --abbrev-ref HEAD)"
