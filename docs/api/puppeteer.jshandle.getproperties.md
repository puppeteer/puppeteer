---
sidebar_label: JSHandle.getProperties
---

# JSHandle.getProperties() method

Gets a map of handles representing the properties of the current handle.

#### Signature:

```typescript
class JSHandle &#123;getProperties(): Promise<Map<string, JSHandle>>;&#125;
```

**Returns:**

Promise&lt;Map&lt;string, [JSHandle](./puppeteer.jshandle.md)&gt;&gt;

## Example

```ts
const listHandle = await page.evaluateHandle(() => document.body.children);
const properties = await listHandle.getProperties();
const children = [];
for (const property of properties.values()) &#123;
  const element = property.asElement();
  if (element) &#123;
    children.push(element);
  &#125;
&#125;
children; // holds elementHandles to all children of document.body
```
