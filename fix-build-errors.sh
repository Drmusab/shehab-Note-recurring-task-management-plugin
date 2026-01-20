#!/bin/bash

# Fix Svelte syntax errors in the codebase
# These are pre-existing issues that need to be fixed

cd "$(dirname "$0")"

echo "Fixing Svelte conditional syntax..."
find src -name "*.svelte" -print0 | xargs -0 sed -i 's/{: else if/{:else if/g; s/{: else}/{:else}/g'

echo "Fixing CSS pseudo-class syntax..."
find src -name "*.svelte" -print0 | xargs -0 sed -i 's/:hover: not/:hover:not/g'

echo "Fixing CSS class selectors with spaces..."
find src -name "*.svelte" -print0 | xargs -0 sed -i 's/\. active/.active/g; s/\. dashboard/.dashboard/g; s/\. task-card/.task-card/g; s/\. quick-add-card/.quick-add-card/g'

echo "Fixing import paths..."
sed -i 's/SearchTab\. svelte/SearchTab.svelte/g' src/components/Dashboard.svelte

echo "Done! Now run: npm run build"
