---
sidebar_label: ElementHandle.isVisible
---

# ElementHandle.isVisible() method

An element is considered to be visible if all of the following is true:

- the element has [computed styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle).

- the element has a non-empty [bounding client rect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

- the element's [visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility) is not `hidden` or `collapse`.

### Signature

```typescript
class ElementHandle {
  isVisible(): Promise<boolean>;
}
```

**Returns:**

Promise&lt;boolean&gt;
