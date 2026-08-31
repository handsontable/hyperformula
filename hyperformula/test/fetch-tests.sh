#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# The directory that holds test/. That is the repository root today, and will be
# the hyperformula package root once this repository becomes a monorepo. Either
# way it sits inside the git working tree, which is all `git rev-parse` needs.
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
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

# 2. Get the current branch of the hyperformula working tree (GitHub Actions uses a
#    detached HEAD, so prefer the env vars there)
cd "$PACKAGE_ROOT"
if [ -n "$GITHUB_HEAD_REF" ]; then
  CURRENT_BRANCH="$GITHUB_HEAD_REF"
elif [ -n "$GITHUB_REF_NAME" ] && [[ "$GITHUB_REF_NAME" != *"/merge" ]]; then
  CURRENT_BRANCH="$GITHUB_REF_NAME"
else
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  [ "$CURRENT_BRANCH" = "HEAD" ] && CURRENT_BRANCH="develop"
fi

echo "Checking out branch $CURRENT_BRANCH in hyperformula-tests..."

# 3. Checkout matching branch in hyperformula-tests or create it if it doesn't exist
cd "$HYPERFORMULA_TESTS_DIR"
git fetch origin

if git show-ref --verify --quiet "refs/heads/$CURRENT_BRANCH" || \
   git show-ref --verify --quiet "refs/remotes/origin/$CURRENT_BRANCH"; then
  git checkout "$CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH" # pull latest changes
else
  echo "Branch $CURRENT_BRANCH not found in hyperformula-tests, creating from develop..."
  git checkout develop
  git pull origin develop
  git checkout -b "$CURRENT_BRANCH"
fi
