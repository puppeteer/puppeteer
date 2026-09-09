---
sidebar_label: JSHandle.getProperties
---

# JSHandle.getProperties() method

Gets a map of handles representing the properties of the current handle.

### Signature

```typescript
class JSHandle {
  getProperties(): Promise<Map<string, JSHandle>>;
}
```

**Returns:**

Promise&lt;Map&lt;string, [JSHandle](./puppeteer.jshandle.md)&gt;&gt;

## Example

```ts
const listHandle = await page.evaluateHandle(() => document.body.children);
const properties = await listHandle.getProperties();
const children = [];
for (const property of properties.values()) {
  const element = property.asElement();
  if (element) {
    children.push(element);
  }
}
children; // holds elementHandles to all children of document.body
```
