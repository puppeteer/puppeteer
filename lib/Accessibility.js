/**
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
 * @property {number=} valuemin
 * @property {number=} valuemax
 *
 * @property {string=} autocomplete
 * @property {string=} haspopup
 * @property {string=} invalid
 * @property {string=} orientation
 *
 * @property {Array<SerializedAXNode>=} children
 */

class Accessibility {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client) {
    this._client = client;
  }

  /**
   * @param {{interestingOnly?: boolean, root?: ?Puppeteer.ElementHandle}=} options
   * @return {!Promise<!SerializedAXNode>}
   */
  async snapshot(options = {}) {
    const {
      interestingOnly = true,
      root = null,
    } = options;
    const {nodes} = await this._client.send('Accessibility.getFullAXTree');
    let backendNodeId = null;
    if (root) {
      const {node} = await this._client.send('DOM.describeNode', {objectId: root._remoteObject.objectId});
      backendNodeId = node.backendNodeId;
    }
    const defaultRoot = AXNode.createTree(nodes);
    let needle = defaultRoot;
    if (backendNodeId) {
      needle = defaultRoot.find(node => node._payload.backendDOMNodeId === backendNodeId);
      if (!needle)
        return null;
    }
    if (!interestingOnly)
      return serializeTree(needle)[0];

    /** @type {!Set<!AXNode>} */
    const interestingNodes = new Set();
    collectInterestingNodes(interestingNodes, defaultRoot, false);
    if (!interestingNodes.has(needle))
      return null;
    return serializeTree(needle, interestingNodes)[0];
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
  /**
   * @param {!Protocol.Accessibility.AXNode} payload
   */
  constructor(payload) {
    this._payload = payload;

    /** @type {!Array<!AXNode>} */
    this._children = [];

    this._richlyEditable = false;
    this._editable = false;
    this._focusable = false;
    this._expanded = false;
    this._hidden = false;
    this._name = this._payload.name ? this._payload.name.value : '';
    this._role = this._payload.role ? this._payload.role.value : 'Unknown';
    this._cachedHasFocusableChild;

    for (const property of this._payload.properties || []) {
      if (property.name === 'editable') {
        this._richlyEditable = property.value.value === 'richtext';
        this._editable = true;
      }
      if (property.name === 'focusable')
        this._focusable = property.value.value;
      if (property.name === 'expanded')
        this._expanded = property.value.value;
      if (property.name === 'hidden')
        this._hidden = property.value.value;
    }
  }

  /**
   * @return {boolean}
   */
  _isPlainTextField() {
    if (this._richlyEditable)
      return false;
    if (this._editable)
      return true;
    return this._role === 'textbox' || this._role === 'ComboBox' || this._role === 'searchbox';
  }

  /**
   * @return {boolean}
   */
  _isTextOnlyObject() {
    const role = this._role;
    return (role === 'LineBreak' || role === 'text' ||
            role === 'InlineTextBox');
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
   * @param {function(AXNode):boolean} predicate
   * @return {?AXNode}
   */
  find(predicate) {
    if (predicate(this))
      return this;
    for (const child of this._children) {
      const result = child.find(predicate);
      if (result)
        return result;
    }
    return null;
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
      case 'doc-cover':
      case 'graphics-symbol':
      case 'img':
      case 'Meter':
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
      case 'button':
      case 'checkbox':
      case 'ColorWell':
      case 'combobox':
      case 'DisclosureTriangle':
      case 'listbox':
      case 'menu':
      case 'menubar':
      case 'menuitem':
      case 'menuitemcheckbox':
      case 'menuitemradio':
      case 'radio':
      case 'scrollbar':
      case 'searchbox':
      case 'slider':
      case 'spinbutton':
      case 'switch':
      case 'tab':
      case 'textbox':
      case 'tree':
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
    const role = this._role;
    if (role === 'Ignored' || this._hidden)
      return false;

    if (this._focusable || this._richlyEditable)
      return true;

    // If it's not focusable but has a control role, then it's interesting.
    if (this.isControl())
      return true;

    // A non focusable child of a control is not interesting
    if (insideControl)
      return false;

    return this.isLeafNode() && !!this._name;
  }

  /**
   * @return {!SerializedAXNode}
   */
  serialize() {
    /** @type {!Map<string, number|string|boolean>} */
    const properties = new Map();
    for (const property of this._payload.properties || [])
      properties.set(property.name.toLowerCase(), property.value.value);
    if (this._payload.name)
      properties.set('name', this._payload.name.value);
    if (this._payload.value)
      properties.set('value', this._payload.value.value);
    if (this._payload.description)
      properties.set('description', this._payload.description.value);

    /** @type {SerializedAXNode} */
    const node = {
      role: this._role
    };

    /** @type {!Array<keyof SerializedAXNode>} */
    const userStringProperties = [
      'name',
      'value',
      'description',
      'keyshortcuts',
      'roledescription',
      'valuetext',
    ];
    for (const userStringProperty of userStringProperties) {
      if (!properties.has(userStringProperty))
        continue;
      node[userStringProperty] = properties.get(userStringProperty);
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
      // WebArea's treat focus differently than other nodes. They report whether their frame  has focus,
      // not whether focus is specifically on the root node.
      if (booleanProperty === 'focused' && this._role === 'WebArea')
        continue;
      const value = properties.get(booleanProperty);
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
      if (!properties.has(tristateProperty))
        continue;
      const value = properties.get(tristateProperty);
      node[tristateProperty] = value === 'mixed' ? 'mixed' : value === 'true' ? true : false;
    }
    /** @type {!Array<keyof SerializedAXNode>} */
    const numericalProperties = [
      'level',
      'valuemax',
      'valuemin',
    ];
    for (const numericalProperty of numericalProperties) {
      if (!properties.has(numericalProperty))
        continue;
      node[numericalProperty] = properties.get(numericalProperty);
    }
    /** @type {!Array<keyof SerializedAXNode>} */
    const tokenProperties = [
      'autocomplete',
      'haspopup',
      'invalid',
      'orientation',
    ];
    for (const tokenProperty of tokenProperties) {
      const value = properties.get(tokenProperty);
      if (!value || value === 'false')
        continue;
      node[tokenProperty] = value;
    }
    return node;
  }

  /**
   * @param {!Array<!Protocol.Accessibility.AXNode>} payloads
   * @return {!AXNode}
   */
  static createTree(payloads) {
    /** @type {!Map<string, !AXNode>} */
    const nodeById = new Map();
    for (const payload of payloads)
      nodeById.set(payload.nodeId, new AXNode(payload));
    for (const node of nodeById.values()) {
      for (const childId of node._payload.childIds || [])
        node._children.push(nodeById.get(childId));
    }
    return nodeById.values().next().value;
  }
}

module.exports = {Accessibility};
