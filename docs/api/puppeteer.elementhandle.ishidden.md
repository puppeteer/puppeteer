---
sidebar_label: ElementHandle.isHidden
---

# ElementHandle.isHidden() method

An element is considered to be hidden if at least one of the following is true:

- the element has no [computed styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle).

- the element has an empty [bounding client rect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

- the element's [visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility) is `hidden` or `collapse`.

### Signature

```typescript
class ElementHandle {
  isHidden(): Promise<boolean>;
}
```

**Returns:**

Promise&lt;boolean&gt;
