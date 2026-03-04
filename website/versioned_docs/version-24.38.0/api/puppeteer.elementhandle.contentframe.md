---
sidebar_label: ElementHandle.contentFrame
---

# ElementHandle.contentFrame() method

<h2 id="overload-1">contentFrame(): Promise&lt;Frame&gt;</h2>

Resolves the frame associated with the element, if any. Always exists for HTMLIFrameElements.

### Signature

```typescript
class ElementHandle {
  abstract contentFrame(this: ElementHandle<HTMLIFrameElement>): Promise<Frame>;
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

this

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLIFrameElement&gt;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;

<h2 id="overload-2">contentFrame(): Promise&lt;Frame \| null&gt;</h2>

### Signature

```typescript
class ElementHandle {
  abstract contentFrame(): Promise<Frame | null>;
}
```

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md) \| null&gt;
