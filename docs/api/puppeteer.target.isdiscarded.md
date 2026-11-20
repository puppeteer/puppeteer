---
sidebar_label: Target.isDiscarded
---

# Target.isDiscarded() method

Checks whether this target is discarded.

### Signature

```typescript
class Target {
  isDiscarded(): boolean;
}
```

**Returns:**

boolean

## Remarks

A target of type ["tab"](./puppeteer.targettype.md) is discarded while Chrome keeps its tab discarded. A target of type ["page"](./puppeteer.targettype.md) is discarded if Chrome closed it because it discarded the tab of the target. When Chrome reloads a discarded tab, it creates new targets that are not discarded.

Targets inside a page, such as out-of-process iframes and dedicated workers, close together with the page. Do not use this method to find out why such a target closed: it can return `false` for them even if Chrome discarded their tab.

The value of a closed target can change from `false` to `true` after the [targetdestroyed](./puppeteer.browserevent.md) event, because Chrome can close the target before it reports that the tab is discarded. In rare cases, a target that closed for another reason, with no target to replace it, is also reported as discarded if Chrome discards its tab later.

Currently only supported for Chrome and the CDP protocol.
