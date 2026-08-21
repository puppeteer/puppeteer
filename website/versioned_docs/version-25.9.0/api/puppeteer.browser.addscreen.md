---
sidebar_label: Browser.addScreen
---

# Browser.addScreen() method

Adds a new screen, returns the added [screen information object](./puppeteer.screeninfo.md).

### Signature

```typescript
class Browser {
  abstract addScreen(params: AddScreenParams): Promise<ScreenInfo>;
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

params

</td><td>

[AddScreenParams](./puppeteer.addscreenparams.md)

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[ScreenInfo](./puppeteer.screeninfo.md)&gt;

## Remarks

Only supported in headless mode.
