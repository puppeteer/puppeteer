# `third_party`

This folder contains code that interacts with third party node modules that will
be vendored with puppeteer during publishing.

## Why not `node_modules`?

Because we are working towards an agnostic Puppeteer that can run in any
environment (see [#6125](https://github.com/puppeteer/puppeteer/issues/6125)) we
cannot import common dependencies in a way that relies on Node's resolution to
find them. For example, `import mitt from 'mitt'` works fine in Node, but in an
ESM build running in an environment without module resolution such as the
browser, `'mitt'` would not make sense.

The process for installing/using a vendored dependency is a two-step process:

1. Create a folder named after the package. See the `node_modules` folder for
   inspiration.
2. Create an entrypoint that exports needed imports from the package. For
   example, `index.ts` may contain

```ts
export * from 'your-package';
export {default as default} from 'your-package';
```

Now if you need to import from the dependency, you need to import relative to
this directory rather than the package name itself.
