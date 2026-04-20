---
sidebar_label: Extension
---

# Extension class

[Extension](./puppeteer.extension.md) represents a browser extension installed in the browser. It provides access to the extension's ID, name, and version, as well as methods for interacting with the extension's background workers and pages.

### Signature

```typescript
export declare abstract class Extension
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Extension` class.

## Example

To get all extensions installed in the browser:

```ts
const extensions = await browser.extensions();
for (const [id, extension] of extensions) {
  console.log(extension.name, id);
}
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="enabled">enabled</span>

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the extension is enabled.

</td></tr>
<tr><td>

<span id="id">id</span>

</td><td>

`readonly`

</td><td>

string

</td><td>

The unique identifier of the extension.

</td></tr>
<tr><td>

<span id="name">name</span>

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the extension as specified in its manifest.

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`readonly`

</td><td>

string

</td><td>

The path in the file system where the extension is located.

</td></tr>
<tr><td>

<span id="version">version</span>

</td><td>

`readonly`

</td><td>

string

</td><td>

The version of the extension as specified in its manifest.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="pages">[pages()](./puppeteer.extension.pages.md)</span>

</td><td>

</td><td>

Returns a list of the currently active and visible pages belonging to the extension.

</td></tr>
<tr><td>

<span id="triggeraction">[triggerAction(page)](./puppeteer.extension.triggeraction.md)</span>

</td><td>

</td><td>

Triggers the default action of the extension for a specified page. This typically simulates a user clicking the extension's action icon in the browser toolbar, potentially opening a popup or executing an action script.

</td></tr>
<tr><td>

<span id="workers">[workers()](./puppeteer.extension.workers.md)</span>

</td><td>

</td><td>

Returns a list of the currently active service workers belonging to the extension.

</td></tr>
</tbody></table>
