# Vendoring third party dependencies

Because we are working towards an agnostic Puppeteer that can run in any environment (see [#6125](https://github.com/puppeteer/puppeteer/issues/6125)) we cannot import common dependencies in a way that relies on Node's resolution to find them. For example, `import mitt from 'mitt'` works fine in Node, but in an ESM build running in the browser, the browser has no idea where to find `'mitt'`.

Therefore we put all common dependencies into this directory, `vendor`. This means there are extra criteria for these dependencies; ideally they will not depend on any other modules. If they do, we should consider an alternative way of managing our dependencies.

The process for updating a vendored dependency is:

1. `npm install {DEP NAME HERE}`
2. `cp -r node_modules/DEP vendor`
3. Update `eslintrc.js` to forbid importing DEP directly (see the `Mitt` rule already defined in there).
4. Use the new DEP, and run `npm run build` to check everything compiles successfully.
5. If the dep ships as compiled JS, you may need to disable TypeScript checking the file. Add an entry to the `excludes` property of the TSConfig files in `vendor`. (again, see the entry that's already there for Mitt as an example). Don't forget to update both the ESM and CJS config files.
