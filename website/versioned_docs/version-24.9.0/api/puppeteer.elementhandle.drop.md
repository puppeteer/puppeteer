---
sidebar_label: ElementHandle.drop
---

# ElementHandle.drop() method

<h2 id="drop">drop(): Promise&lt;void&gt;</h2>

Drops the given element onto the current one.

### Signature

```typescript
class ElementHandle {
  drop(
    this: ElementHandle<Element>,
    element: ElementHandle<Element>,
  ): Promise<void>;
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

<h2 id="drop-1">drop(): Promise&lt;void&gt;</h2>

> Warning: This API is now obsolete.
>
> No longer supported.

### Signature

```typescript
class ElementHandle {
  drop(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData,
  ): Promise<void>;
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
