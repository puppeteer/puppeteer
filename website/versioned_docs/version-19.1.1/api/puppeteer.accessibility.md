---
sidebar_label: Accessibility
---

# Accessibility class

The Accessibility class provides methods for inspecting Chromium's accessibility tree. The accessibility tree is used by assistive technology such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader) or [switches](https://en.wikipedia.org/wiki/Switch_access).

#### Signature:

```typescript
export declare class Accessibility
```

## Remarks

Accessibility is a very platform-specific thing. On different platforms, there are different screen readers that might have wildly different output.

Blink - Chrome's rendering engine - has a concept of "accessibility tree", which is then translated into different platform-specific APIs. Accessibility namespace gives users access to the Blink Accessibility Tree.

Most of the accessibility tree gets filtered out when converting from Blink AX Tree to Platform-specific AX-Tree or by assistive technologies themselves. By default, Puppeteer tries to approximate this filtering, exposing only the "interesting" nodes of the tree.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Accessibility` class.

## Methods

| Method                                                     | Modifiers | Description                                                                                                                |
| ---------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| [snapshot(options)](./puppeteer.accessibility.snapshot.md) |           | Captures the current state of the accessibility tree. The returned object represents the root accessible node of the page. |
