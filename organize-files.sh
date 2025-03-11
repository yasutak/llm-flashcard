#!/bin/bash

# This script organizes files and folders in the project

# Remove unnecessary test files
echo "Removing unnecessary test files..."
rm -f test-*.js
rm -f *-test-results*.log
rm -f public/test-*.html

echo "File organization complete!"
