/**
 * These global declarations exist so puppeteer can work without the need to use `"dom"`
 * types.
 *
 * To get full type information for these interfaces, add `"types": "dom"`in your
 * `tsconfig.json` file.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Document {}

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Element {}

  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
  interface NodeListOf<TNode> {}
}

export {};
