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
const {helper} = require('./helper');

class Accessibility {
  /**
   * @param {!Puppeteer.CDPSession} client
   */
  constructor(client) {
    this._client = client;
  }

  /**
   * @return {!Promise<string>}
   */
  async snapshot() {
    const {nodes} = await this._client.send('Accessibility.getFullAXTree');
    const root = AXNode._createTree(nodes);
    const lines = [];
    for (let node = root; node; node = node._nextInterestingNode()) {
      let depth = 0;
      let parent = node._parent;
      while (parent && depth < 10) {
        if (parent.isInteresting())
          depth++;
        parent = parent._parent;
      }
      lines.push('  '.repeat(depth) + node.toString());
    }
    return lines.join('\n');
  }
}

class AXNode {
  /**
   * @param {!Protocol.Accessibility.AXNode} payload
   */
  constructor(payload) {
    this._payload = payload;

    /** @type {!Array<!AXNode>} */
    this._children = [];
    /** @type {?AXNode} */
    this._parent = null;

    this._richlyEditable = false;
    this._editable = false;
    this._focusable = false;
    this._expanded = false;

    for (const property of this._payload.properties || []) {
      if (property.name === 'editable') {
        this._richlyEditable = property.value.value === 'richtext';
        this._editable = true;
      }
      if (property.name === 'focusable')
        this._focusable = property.value.value;
      if (property.name === 'expanded')
        this._expanded = property.value.value;

    }
  }

  focusable() {
    return this._focusable;
  }

  name() {
    return this._payload.name ? this._payload.name.value : '';
  }

  role() {
    return this._payload.role ? this._payload.role.value : 'Unknown';
  }


  _nextExternalNode() {
    let node = /** @type {!AXNode} */ (this);
    while (node._parent) {
      const siblings = node._parent._children;
      const sibling = siblings[siblings.indexOf(node) + 1];
      if (sibling)
        return sibling;
      node = node._parent;
    }
    return null;
  }

  _nextInterestingNode() {
    let node = /** @type {!AXNode} */ (this);
    do {
      if (node._isLeafNode())
        node = node._nextExternalNode();
      else
        node = node._children[0];
    } while (node && !node.isInteresting());

    return node;
  }

  _isPlainTextField() {
    if (this._richlyEditable)
      return false;
    // We need to check both the role and editable state, because some ARIA text
    // fields may in fact not be editable, whilst some editable fields might not
    // have the role.
    if (this._editable && !(this._parent && this._parent._editable))
      return true;
    const role = this.role();
    return role === 'textbox' || role === 'ComboBox' || role === 'searchbox';
  }

  _isTextOnlyObject() {
    const role = this.role();
    return (role === 'LineBreak' || role === 'text' ||
            role === 'InlineTextBox');
  }

  _hasFocusableChild() {
    for (const child of this._children) {
      if (child.focusable() || child._hasFocusableChild())
        return true;
    }
    return false;
  }

  _isLeafNode() {
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
    switch (this.role()) {
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

    if (this.role() === 'combobox' && !this._expanded)
      return true;

    if (this._hasFocusableChild())
      return false;

    if (this.focusable() && this.name())
      return true;
    if (this.role() === 'heading' && this.name())
      return true;
    return false;
  }

  _isControl() {
    switch (this.role()) {
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
      case 'MenuListPopup':
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
   * @return {boolean}
   */
  isInteresting() {
    const role = this.role();
    if (role === 'Ignored')
      return false;

    if (role === 'menuitem') {
      // menuitems are only interesting if they are selected, or thier contained is expanded
      // TODO
      return true;
    }
    if (this.focusable())
      return true;

    // If it's not focusable but has a control role, then it's interesting.
    if (this._isControl())
      return true;

    // A non focusable child of a control is not interesting
    let parent = this._parent;
    while (parent) {
      if (this._isControl())
        return false;
      parent = parent._parent;
    }

    return this._isLeafNode() && !!this.name();
  }

  toString() {
    // - [${this._children.map(child => child.toString()).join(', ')}]
    const parts = [];
    parts.push(`[${this._payload.role.value}]`);
    // if (this.name())
    //   parts.push(`'${this.name()}'`);
    // for (const property of this._payload.properties || [])
    //   parts.push(property.name + ': ' + property.value.value);
    const properties = new Map();
    for (const property of this._payload.properties || [])
      properties.set(property.name, property.value.value);
    if (this._payload.name)
      properties.set('name', this._payload.name.value);
    if (this._payload.value)
      properties.set('value', this._payload.value.value);
    if (this._payload.description)
      properties.set('description', this._payload.description.value);
    // const booleanProperties = new Set();
    for (const userStringProperty of ['name', 'value', 'description', 'keyshortcuts', 'roledescription']) {
      const value = properties.get(userStringProperty);
      if (value)
        parts.push(`${userStringProperty}=${JSON.stringify(value)}`);
    }

    for (const tokenProperty of [
      'autocomplete',
      'busy',
      'checked',
      'disabled',
      'expanded',
      'hasPopup',
      'hidden',
      'invalid',
      'level',
      'modal',
      'multiline',
      'multiselectable',
      'orientation',
      'pressed',
      'readonly',
      'required',
      'selected',
      'valuemax',
      'valuemin',
      'valuetext'
    ]) {
      const value = properties.get(tokenProperty);
      if (!value || value === 'false')
        continue;
      if (value === 'true' || value === true)
        parts.push(tokenProperty);
      else
        parts.push(`${tokenProperty}=${value}`);
    }


    return parts.join(' ');
  }

  toStringO() {
    // - [${this._children.map(child => child.toString()).join(', ')}]
    const parts = [];
    parts.push(`[${this._payload.role.value}]`);
    if (this.name())
      parts.push(`'${this.name()}'`);
    if (this._payload.value)
      parts.push(`|${this._payload.value.value}|`);
    if (this._payload.description)
      parts.push(`(${this._payload.description.value})`);
    // for (const property of this._payload.properties || [])
    //   parts.push(property.name + ': ' + property.value.value);
    const properties = new Map();
    for (const property of this._payload.properties || [])
      properties.set(property.name, property.value.value);
    // const booleanProperties = new Set();
    for (const booleanProperty of ['invalid', 'multiline', 'readonly', 'required', 'expanded', 'editable', 'disabled']) {
      const value = properties.get(booleanProperty);
      if (value && value !== 'false')
        parts.push(booleanProperty);
    }


    return parts.join(' ');
  }

  /**
   * @param {!AXNode} child
   */
  _addChild(child) {
    child._parent = this;
    this._children.push(child);
  }

  /**
   * @param {!Array<!Protocol.Accessibility.AXNode>} payloads
   * @return {!AXNode}
   */
  static _createTree(payloads) {
    /** @type {!Map<string, !AXNode>} */
    const nodeById = new Map();
    for (const payload of payloads)
      nodeById.set(payload.nodeId, new AXNode(payload));
    for (const node of nodeById.values()) {
      for (const childId of node._payload.childIds || [])
        node._addChild(nodeById.get(childId));
    }
    let root = nodeById.values().next().value;
    while (root._parent)
      root = root._parent;
    return root;
  }
}

module.exports = {Accessibility};
helper.tracePublicAPI(Accessibility);
