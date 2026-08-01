#!/bin/bash
set -e

# Reorganize project structure to standard React + Vite architecture

echo "Creating new directories..."
mkdir -p public
mkdir -p src/assets/images
mkdir -p src/assets/icons
mkdir -p src/assets/fonts
mkdir -p src/components
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/contexts
mkdir -p src/pages
mkdir -p src/layouts
mkdir -p src/utils
mkdir -p src/lib
mkdir -p src/constants
mkdir -p src/types

echo "Moving root files to src/..."
[ -f "App.tsx" ] && mv App.tsx src/App.tsx || true
[ -f "index.css" ] && mv index.css src/index.css || true
[ -f "vite-env.d.ts" ] && mv vite-env.d.ts src/vite-env.d.ts || true
[ -f "index.tsx" ] && mv index.tsx src/main.tsx || true
[ -f "types.ts" ] && mv types.ts src/types/index.ts || true

echo "Moving directories to src/..."
# Move contents instead of the directory itself to avoid nesting (e.g. src/components/components)
[ -d "components" ] && mv components/* src/components/ 2>/dev/null || true
[ -d "services" ] && mv services/* src/services/ 2>/dev/null || true
[ -d "utils" ] && mv utils/* src/utils/ 2>/dev/null || true

echo "Removing empty root directories..."
[ -d "components" ] && rmdir components 2>/dev/null || true
[ -d "services" ] && rmdir services 2>/dev/null || true
[ -d "utils" ] && rmdir utils 2>/dev/null || true

echo "Updating index.html..."
# Update the script source in index.html
if [ -f "index.html" ]; then
    sed -i 's|src="/index.tsx"|src="/src/main.tsx"|g' index.html
fi

echo "Updating tsconfig.json (if necessary)..."
# Just update paths nicely if standard
if [ -f "tsconfig.json" ]; then
    sed -i 's|"./\*"|"./src/*"|g' tsconfig.json
fi

echo "All tasks completed successfully."
