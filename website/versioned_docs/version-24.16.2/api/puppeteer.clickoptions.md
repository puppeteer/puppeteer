---
sidebar_label: ClickOptions
---

# ClickOptions interface

### Signature

```typescript
export interface ClickOptions extends MouseClickOptions
```

**Extends:** [MouseClickOptions](./puppeteer.mouseclickoptions.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="debughighlight">debugHighlight</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

**_(Experimental)_** An experimental debugging feature. If true, inserts an element into the page to highlight the click location for 10 seconds. Might not work on all pages and does not persist across navigations.

</td><td>

</td></tr>
<tr><td>

<span id="offset">offset</span>

</td><td>

`optional`

</td><td>

[Offset](./puppeteer.offset.md)

</td><td>

Offset for the clickable point relative to the top-left corner of the border box.

</td><td>

</td></tr>
</tbody></table>
