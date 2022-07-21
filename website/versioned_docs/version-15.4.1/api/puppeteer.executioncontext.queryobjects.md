---
sidebar_label: ExecutionContext.queryObjects
---

# ExecutionContext.queryObjects() method

This method iterates the JavaScript heap and finds all the objects with the given prototype.

**Signature:**

```typescript
class ExecutionContext {
  queryObjects<Prototype>(
    prototypeHandle: JSHandle<Prototype>
  ): Promise<HandleFor<Prototype[]>>;
}
```

## Parameters

| Parameter       | Type                                                 | Description                      |
| --------------- | ---------------------------------------------------- | -------------------------------- |
| prototypeHandle | [JSHandle](./puppeteer.jshandle.md)&lt;Prototype&gt; | a handle to the object prototype |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Prototype\[\]&gt;&gt;

A handle to an array of objects with the given prototype.

## Remarks

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
