/**
 * @typedef {Object} SerializedAXNode
 * @property {string} role
 *
 * @property {string=} name
 * @property {string|number=} value
 * @property {string=} description
 *
 * @property {string=} keyshortcuts
 * @property {string=} roledescription
 * @property {string=} valuetext
 *
 * @property {boolean=} disabled
 * @property {boolean=} expanded
 * @property {boolean=} focused
 * @property {boolean=} modal
 * @property {boolean=} multiline
 * @property {boolean=} multiselectable
 * @property {boolean=} readonly
 * @property {boolean=} required
 * @property {boolean=} selected
 *
 * @property {boolean|"mixed"=} checked
 * @property {boolean|"mixed"=} pressed
 *
 * @property {number=} level
 *
 * @property {string=} autocomplete
 * @property {string=} haspopup
 * @property {string=} invalid
 * @property {string=} orientation
 *
 * @property {Array<SerializedAXNode>=} children
 */

class Accessibility {
  constructor(session) {
    this._session = session;
  }

  /**
   * @param {{interestingOnly?: boolean}=} options
   * @return {!Promise<!SerializedAXNode>}
   */
  async snapshot(options = {}) {
    const {interestingOnly = true} = options;
    const {tree} = await this._session.send('Accessibility.getFullAXTree');
    const root = new AXNode(tree);
    if (!interestingOnly)
      return serializeTree(root)[0];

    /** @type {!Set<!AXNode>} */
    const interestingNodes = new Set();
    collectInterestingNodes(interestingNodes, root, false);
    return serializeTree(root, interestingNodes)[0];
  }
}

/**
 * @param {!Set<!AXNode>} collection
 * @param {!AXNode} node
 * @param {boolean} insideControl
 */
function collectInterestingNodes(collection, node, insideControl) {
  if (node.isInteresting(insideControl))
    collection.add(node);
  if (node.isLeafNode())
    return;
  insideControl = insideControl || node.isControl();
  for (const child of node._children)
    collectInterestingNodes(collection, child, insideControl);
}

/**
 * @param {!AXNode} node
 * @param {!Set<!AXNode>=} whitelistedNodes
 * @return {!Array<!SerializedAXNode>}
 */
function serializeTree(node, whitelistedNodes) {
  /** @type {!Array<!SerializedAXNode>} */
  const children = [];
  for (const child of node._children)
    children.push(...serializeTree(child, whitelistedNodes));

  if (whitelistedNodes && !whitelistedNodes.has(node))
    return children;

  const serializedNode = node.serialize();
  if (children.length)
    serializedNode.children = children;
  return [serializedNode];
}


class AXNode {
  constructor(payload) {
    this._payload = payload;

    /** @type {!Array<!AXNode>} */
    this._children = (payload.children || []).map(x => new AXNode(x));

    this._editable = payload.editable;
    this._richlyEditable = this._editable && (payload.tag !== 'textarea' && payload.tag !== 'input');
    this._focusable = payload.focusable;
    this._expanded = payload.expanded;
    this._name = this._payload.name;
    this._role = this._payload.role;
    this._cachedHasFocusableChild;
  }

  /**
   * @return {boolean}
   */
  _isPlainTextField() {
    if (this._richlyEditable)
      return false;
    if (this._editable)
      return true;
    return this._role === 'entry';
  }

  /**
   * @return {boolean}
   */
  _isTextOnlyObject() {
    const role = this._role;
    return (role === 'text leaf' || role === 'text' || role === 'statictext');
  }

  /**
   * @return {boolean}
   */
  _hasFocusableChild() {
    if (this._cachedHasFocusableChild === undefined) {
      this._cachedHasFocusableChild = false;
      for (const child of this._children) {
        if (child._focusable || child._hasFocusableChild()) {
          this._cachedHasFocusableChild = true;
          break;
        }
      }
    }
    return this._cachedHasFocusableChild;
  }

  /**
   * @return {boolean}
   */
  isLeafNode() {
    if (!this._children.length)
      return true;

    // These types of objects may have children that we use as internal
    // implementation details, but we want to expose them as leaves to platform
    // accessibility APIs because screen readers might be confused if they find
    // any children.
    if (this._isPlainTextField() || this._isTextOnlyObject())
      return true;

    // Roles whose children are only presentational according to the ARIA and
    // HTML5 Specs should be hidden from screen readers.
    // (Note that whilst ARIA buttons can have only presentational children, HTML5
    // buttons are allowed to have content.)
    switch (this._role) {
      case 'graphic':
      case 'scrollbar':
      case 'slider':
      case 'separator':
      case 'progressbar':
        return true;
      default:
        break;
    }

    // Here and below: Android heuristics
    if (this._hasFocusableChild())
      return false;
    if (this._focusable && this._name)
      return true;
    if (this._role === 'heading' && this._name)
      return true;
    return false;
  }

  /**
   * @return {boolean}
   */
  isControl() {
    switch (this._role) {
      case 'checkbutton':
      case 'check menu item':
      case 'check rich option':
      case 'combobox':
      case 'combobox option':
      case 'color chooser':
      case 'listbox':
      case 'listbox option':
      case 'listbox rich option':
      case 'popup menu':
      case 'menupopup':
      case 'menuitem':
      case 'menubar':
      case 'button':
      case 'pushbutton':
      case 'radiobutton':
      case 'radio menuitem':
      case 'scrollbar':
      case 'slider':
      case 'spinbutton':
      case 'switch':
      case 'pagetab':
      case 'entry':
      case 'tree table':
        return true;
      default:
        return false;
    }
  }

  /**
   * @param {boolean} insideControl
   * @return {boolean}
   */
  isInteresting(insideControl) {
    if (this._focusable || this._richlyEditable)
      return true;

    // If it's not focusable but has a control role, then it's interesting.
    if (this.isControl())
      return true;

    // A non focusable child of a control is not interesting
    if (insideControl)
      return false;

    return this.isLeafNode() && !!this._name.trim();
  }

  /**
   * @return {!SerializedAXNode}
   */
  serialize() {
    /** @type {SerializedAXNode} */
    const node = {
      role: this._role
    };

    /** @type {!Array<keyof SerializedAXNode>} */
    const userStringProperties = [
      'name',
      'value',
      'description',
      'roledescription',
      'valuetext',
      'keyshortcuts',
    ];
    for (const userStringProperty of userStringProperties) {
      if (!(userStringProperty in this._payload))
        continue;
      node[userStringProperty] = this._payload[userStringProperty];
    }
    /** @type {!Array<keyof SerializedAXNode>} */
    const booleanProperties = [
      'disabled',
      'expanded',
      'focused',
      'modal',
      'multiline',
      'multiselectable',
      'readonly',
      'required',
      'selected',
    ];
    for (const booleanProperty of booleanProperties) {
      if (this._role === 'document' && booleanProperty === 'focused')
        continue; // document focusing is strange
      const value = this._payload[booleanProperty];
      if (!value)
        continue;
      node[booleanProperty] = value;
    }

    /** @type {!Array<keyof SerializedAXNode>} */
    const tristateProperties = [
      'checked',
      'pressed',
    ];
    for (const tristateProperty of tristateProperties) {
      if (!(tristateProperty in this._payload))
        continue;
      const value = this._payload[tristateProperty];
      node[tristateProperty] = value;
    }
    /** @type {!Array<keyof SerializedAXNode>} */
    const numericalProperties = [
      'level',
      'valuemax',
      'valuemin',
    ];
    for (const numericalProperty of numericalProperties) {
      if (!(numericalProperty in this._payload))
        continue;
      node[numericalProperty] = this._payload[numericalProperty];
    }
    /** @type {!Array<keyof SerializedAXNode>} */
    const tokenProperties = [
      'autocomplete',
      'haspopup',
      'invalid',
      'orientation',
    ];
    for (const tokenProperty of tokenProperties) {
      const value = this._payload[tokenProperty];
      if (!value || value === 'false')
        continue;
      node[tokenProperty] = value;
    }
    return node;
  }
}

module.exports = {Accessibility};
