---
sidebar_label: ElementHandle.drop
---

# ElementHandle.drop() method

<h2 id="overload-0">drop(this: ElementHandle&lt;Element&gt;, element: ElementHandle&lt;Element&gt;): Promise&lt;void&gt;;</h2>

### Signature:

```typescript
class ElementHandle {
  drop(
    this: ElementHandle<Element>,
    element: ElementHandle<Element>
  ): Promise<void>;
}
```

Drops the given element onto the current one.

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

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
<tr><td>

element

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

<h2 id="overload-1">drop(this: ElementHandle&lt;Element&gt;, data?: Protocol.Input.DragData): Promise&lt;void&gt;;</h2>

### Signature:

```typescript
class ElementHandle {
  drop(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
}
```

> Warning: This API is now obsolete.
>
> No longer supported.

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

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
<tr><td>

data

</td><td>

Protocol.Input.DragData

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
