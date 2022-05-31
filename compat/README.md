# Compatibility layer

This directory provides an additional compatibility layer between ES modules and CommonJS.

## Why?

Both `./cjs/compat.ts` and `./esm/compat.ts` are written as ES modules, but `./cjs/compat.ts` can additionally use NodeJS CommonJS globals such as `__dirname` and `require` while these are disabled in ES module mode. For more information, see [Differences between ES modules and CommonJS](https://nodejs.org/api/esm.html#differences-between-es-modules-and-commonjs).

## Adding exports

In order to add exports, two things need to be done:

- The exports must be declared in `src/compat.ts`.
- The exports must be realized in `./cjs/compat.ts` and `./esm/compat.ts`.

In the event `compat.ts` becomes too large, you can place declarations in another file. Just make sure `./cjs`, `./esm`, and `src` have the same structure.
