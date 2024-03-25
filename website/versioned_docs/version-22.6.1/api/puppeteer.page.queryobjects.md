---
sidebar_label: Page.queryObjects
---

# Page.queryObjects() method

This method iterates the JavaScript heap and finds all objects with the given prototype.

#### Signature:

```typescript
class Page {
  abstract queryObjects<Prototype>(
    prototypeHandle: JSHandle<Prototype>
  ): Promise<JSHandle<Prototype[]>>;
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

prototypeHandle

</td><td>

[JSHandle](./puppeteer.jshandle.md)&lt;Prototype&gt;

</td><td>

a handle to the object prototype.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[JSHandle](./puppeteer.jshandle.md)&lt;Prototype\[\]&gt;&gt;

Promise which resolves to a handle to an array of objects with this prototype.

## Example

```ts
// Create a Map object
await page.evaluate(() => (window.map = new Map()));
// Get a handle to the Map object prototype
const mapPrototype = await page.evaluateHandle(() => Map.prototype);
// Query all map instances into an array
const mapInstances = await page.queryObjects(mapPrototype);
// Count amount of map objects in heap
const count = await page.evaluate(maps => maps.length, mapInstances);
await mapInstances.dispose();
await mapPrototype.dispose();
```
