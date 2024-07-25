---
sidebar_label: Page.evaluateOnNewDocument
---

# Page.evaluateOnNewDocument() method

Adds a function which would be invoked in one of the following scenarios:

- whenever the page is navigated

- whenever the child frame is attached or navigated. In this case, the function is invoked in the context of the newly attached frame.

The function is invoked after the document was created but before any of its scripts were run. This is useful to amend the JavaScript environment, e.g. to seed `Math.random`.

### Signature

```typescript
class Page {
  abstract evaluateOnNewDocument<
    Params extends unknown[],
    Func extends (...args: Params) => unknown = (...args: Params) => unknown,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<NewDocumentScriptEvaluation>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

pageFunction

</td><td>

Func \| string

</td><td>

Function to be evaluated in browser context

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

Arguments to pass to `pageFunction`

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[NewDocumentScriptEvaluation](./puppeteer.newdocumentscriptevaluation.md)&gt;

## Example

An example of overriding the navigator.languages property before the page loads:

```ts
// preload.js

// overwrite the `languages` property to use a custom getter
Object.defineProperty(navigator, 'languages', {
  get: function () {
    return ['en-US', 'en', 'bn'];
  },
});

// In your puppeteer script, assuming the preload.js file is
// in same folder of our script.
const preloadFile = fs.readFileSync('./preload.js', 'utf8');
await page.evaluateOnNewDocument(preloadFile);
```
