#!/bin/bash

# This script removes test files from the git history

# Files to remove
FILES_TO_REMOVE=(
  "test-api-key.js"
  "test-api-key-new.js"
  "test-api-key-with-log.js"
  "test-auth-and-api-key.js"
  "test-auth-flow.js"
  "test-claude-api-key.js"
  "test-claude-service.js"
  "test-flashcard-generation.js"
  "test-real-api-key.js"
  "public/test-auth-api-key.html"
  "public/test-auth.html"
  "public/test-claude-api-key.html"
  "public/test-auth-flow.html"
  "public/test-login.html"
  "api-key-test-results-new.log"
  "api-key-test-results.log"
  "claude-service-test-results.log"
  "flashcard-generation-test-results.log"
  "real-api-key-test-results.log"
)

# Convert array to space-separated string
FILES_STRING=$(printf " %s" "${FILES_TO_REMOVE[@]}")
FILES_STRING=${FILES_STRING:1} # Remove leading space

# Create a backup branch
git branch backup-before-filter

# Use git filter-branch to remove files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch $FILES_STRING" \
  --prune-empty --tag-name-filter cat -- --all

echo "Files have been removed from git history."
echo "A backup branch 'backup-before-filter' has been created."
echo "To push the changes to the remote repository, run:"
echo "  git push origin --force --all"
echo "  git push origin --force --tags"
echo ""
echo "To clean up the local repository, run:"
echo "  git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin"
echo "  git reflog expire --expire=now --all"
echo "  git gc --prune=now"
