# Injected

This folder contains code that is injected into every Puppeteer execution context. Each file is transpiled using esbuild into a script in `src/generated` which is then imported into server code.

See `utils/generate_injected.ts` for more information.
