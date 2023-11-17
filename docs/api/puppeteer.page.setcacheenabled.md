---
sidebar_label: Page.setCacheEnabled
---

# Page.setCacheEnabled() method

Toggles ignoring cache for each request based on the enabled state. By default, caching is enabled.

#### Signature:

```typescript
class Page {
  abstract setCacheEnabled(enabled?: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                                               |
| --------- | ------- | --------------------------------------------------------- |
| enabled   | boolean | _(Optional)_ sets the <code>enabled</code> state of cache |

**Returns:**

Promise&lt;void&gt;

#### Default value:

`true`

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
