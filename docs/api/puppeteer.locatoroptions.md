---
sidebar_label: LocatorOptions
---

# LocatorOptions interface

#### Signature:

```typescript
export interface LocatorOptions
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

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<p id="ensureelementisintheviewport">ensureElementIsInTheViewport</p>

</td><td>

</td><td>

boolean

</td><td>

Whether to scroll the element into viewport if not in the viewprot already.

</td><td>

`true`

</td></tr>
<tr><td>

<p id="timeout">timeout</p>

</td><td>

</td><td>

number

</td><td>

Total timeout for the entire locator operation.

Pass `0` to disable timeout.

</td><td>

`Page.getDefaultTimeout()`

</td></tr>
<tr><td>

<p id="visibility">visibility</p>

</td><td>

</td><td>

[VisibilityOption](./puppeteer.visibilityoption.md)

</td><td>

Whether to wait for the element to be `visible` or `hidden`. `null` to disable visibility checks.

</td><td>

</td></tr>
<tr><td>

<p id="waitforenabled">waitForEnabled</p>

</td><td>

</td><td>

boolean

</td><td>

Whether to wait for input elements to become enabled before the action. Applicable to `click` and `fill` actions.

</td><td>

`true`

</td></tr>
<tr><td>

<p id="waitforstableboundingbox">waitForStableBoundingBox</p>

</td><td>

</td><td>

boolean

</td><td>

Whether to wait for the element's bounding box to be same between two animation frames.

</td><td>

`true`

</td></tr>
</tbody></table>
