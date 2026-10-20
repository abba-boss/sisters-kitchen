# Switch to NPM to Fix React Duplicate Issue

## Problem
pnpm uses symlinks which can cause Vite to load multiple React instances even when only one is installed. This is causing the "Invalid hook call" errors.

## Solution
Switch from pnpm back to npm (which doesn't use symlinks).

## Steps:

```bash
cd frontend

# 1. Remove pnpm files
rm -rf node_modules pnpm-lock.yaml .npmrc

# 2. Use npm instead
npm install

# 3. Start dev server
npm run dev
```

This should resolve the duplicate React issue because npm installs packages directly without symlinks.
