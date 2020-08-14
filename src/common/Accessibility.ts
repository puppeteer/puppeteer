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

import { CDPSession } from './Connection.js';
import { ElementHandle } from './JSHandle.js';
import { Protocol } from 'devtools-protocol';

/**
 * Represents a Node and the properties of it that are relevant to Accessibility.
 * @public
 */
export interface SerializedAXNode {
  /**
   * The {@link https://www.w3.org/TR/wai-aria/#usage_intro | role} of the node.
   */
  role: string;
  /**
   * A human readable name for the node.
   */
  name?: string;
  /**
   * The current value of the node.
   */
  value?: string | number;
  /**
   * An additional human readable description of the node.
   */
  description?: string;
  /**
   * Any keyboard shortcuts associated with this node.
   */
  keyshortcuts?: string;
  /**
   * A human readable alternative to the role.
   */
  roledescription?: string;
  /**
   * A description of the current value.
   */
  valuetext?: string;
  disabled?: boolean;
  expanded?: boolean;
  focused?: boolean;
  modal?: boolean;
  multiline?: boolean;
  /**
   * Whether more than one child can be selected.
   */
  multiselectable?: boolean;
  readonly?: boolean;
  required?: boolean;
  selected?: boolean;
  /**
   * Whether the checkbox is checked, or in a
   * {@link https://www.w3.org/TR/wai-aria-practices/examples/checkbox/checkbox-2/checkbox-2.html | mixed state}.
   */
  checked?: boolean | 'mixed';
  /**
   * Whether the node is checked or in a mixed state.
   */
  pressed?: boolean | 'mixed';
  /**
   * The level of a heading.
   */
  level?: number;
  valuemin?: number;
  valuemax?: number;
  autocomplete?: string;
  haspopup?: string;
  /**
   * Whether and in what way this node's value is invalid.
   */
  invalid?: string;
  orientation?: string;
  /**
   * Children of this node, if there are any.
   */
  children?: SerializedAXNode[];
}

/**
 * @public
 */
export interface SnapshotOptions {
  /**
   * Prune uninteresting nodes from the tree.
   * @defaultValue true
   */
  interestingOnly?: boolean;
  /**
   * Root node to get the accessibility tree for
   * @defaultValue The root node of the entire page.
   */
  root?: ElementHandle;
}

/**
 * The Accessibility class provides methods for inspecting Chromium's
 * accessibility tree. The accessibility tree is used by assistive technology
 * such as {@link https://en.wikipedia.org/wiki/Screen_reader | screen readers} or
 * {@link https://en.wikipedia.org/wiki/Switch_access | switches}.
 *
 * @remarks
 *
 * Accessibility is a very platform-specific thing. On different platforms,
 * there are different screen readers that might have wildly different output.
 *
 * Blink - Chrome's rendering engine - has a concept of "accessibility tree",
 * which is then translated into different platform-specific APIs. Accessibility
 * namespace gives users access to the Blink Accessibility Tree.
 *
 * Most of the accessibility tree gets filtered out when converting from Blink
 * AX Tree to Platform-specific AX-Tree or by assistive technologies themselves.
 * By default, Puppeteer tries to approximate this filtering, exposing only
 * the "interesting" nodes of the tree.
 *
 * @public
 */
export class Accessibility {
  private _client: CDPSession;

  /**
   * @internal
   */
  constructor(client: CDPSession) {
    this._client = client;
  }

  /**
   * Captures the current state of the accessibility tree.
   * The returned object represents the root accessible node of the page.
   *
   * @remarks
   *
   * **NOTE** The Chromium accessibility tree contains nodes that go unused on
   * most platforms and by most screen readers. Puppeteer will discard them as
   * well for an easier to process tree, unless `interestingOnly` is set to
   * `false`.
   *
   * @example
   * An example of dumping the entire accessibility tree:
   * ```js
   * const snapshot = await page.accessibility.snapshot();
   * console.log(snapshot);
   * ```
   *
   * @example
   * An example of logging the focused node's name:
   * ```js
   * const snapshot = await page.accessibility.snapshot();
   * const node = findFocusedNode(snapshot);
   * console.log(node && node.name);
   *
   * function findFocusedNode(node) {
   *   if (node.focused)
   *     return node;
   *   for (const child of node.children || []) {
   *     const foundNode = findFocusedNode(child);
   *     return foundNode;
   *   }
   *   return null;
   * }
   * ```
   *
   * @returns An AXNode object representing the snapshot.
   *
   */
  public async snapshot(
    options: SnapshotOptions = {}
  ): Promise<SerializedAXNode> {
    const { interestingOnly = true, root = null } = options;
    const { nodes } = await this._client.send('Accessibility.getFullAXTree');
    let backendNodeId = null;
    if (root) {
      const { node } = await this._client.send('DOM.describeNode', {
        objectId: root._remoteObject.objectId,
      });
      backendNodeId = node.backendNodeId;
    }
    const defaultRoot = AXNode.createTree(nodes);
    let needle = defaultRoot;
    if (backendNodeId) {
      needle = defaultRoot.find(
        (node) => node.payload.backendDOMNodeId === backendNodeId
      );
      if (!needle) return null;
    }
    if (!interestingOnly) return this.serializeTree(needle)[0];

    const interestingNodes = new Set<AXNode>();
    this.collectInterestingNodes(interestingNodes, defaultRoot, false);
    if (!interestingNodes.has(needle)) return null;
    return this.serializeTree(needle, interestingNodes)[0];
  }

  private serializeTree(
    node: AXNode,
    interestingNodes?: Set<AXNode>
  ): SerializedAXNode[] {
    const children: SerializedAXNode[] = [];
    for (const child of node.children)
      children.push(...this.serializeTree(child, interestingNodes));

    if (interestingNodes && !interestingNodes.has(node)) return children;

    const serializedNode = node.serialize();
    if (children.length) serializedNode.children = children;
    return [serializedNode];
  }

  private collectInterestingNodes(
    collection: Set<AXNode>,
    node: AXNode,
    insideControl: boolean
  ): void {
    if (node.isInteresting(insideControl)) collection.add(node);
    if (node.isLeafNode()) return;
    insideControl = insideControl || node.isControl();
    for (const child of node.children)
      this.collectInterestingNodes(collection, child, insideControl);
  }
}

class AXNode {
  public payload: Protocol.Accessibility.AXNode;
  public children: AXNode[] = [];

  private _richlyEditable = false;
  private _editable = false;
  private _focusable = false;
  private _hidden = false;
  private _name: string;
  private _role: string;
  private _ignored: boolean;
  private _cachedHasFocusableChild?: boolean;

  constructor(payload: Protocol.Accessibility.AXNode) {
    this.payload = payload;
    this._name = this.payload.name ? this.payload.name.value : '';
    this._role = this.payload.role ? this.payload.role.value : 'Unknown';
    this._ignored = this.payload.ignored;

    for (const property of this.payload.properties || []) {
      if (property.name === 'editable') {
        this._richlyEditable = property.value.value === 'richtext';
        this._editable = true;
      }
      if (property.name === 'focusable') this._focusable = property.value.value;
      if (property.name === 'hidden') this._hidden = property.value.value;
    }
  }

  private _isPlainTextField(): boolean {
    if (this._richlyEditable) return false;
    if (this._editable) return true;
    return this._role === 'textbox' || this._role === 'searchbox';
  }

  private _isTextOnlyObject(): boolean {
    const role = this._role;
    return role === 'LineBreak' || role === 'text' || role === 'InlineTextBox';
  }

  private _hasFocusableChild(): boolean {
    if (this._cachedHasFocusableChild === undefined) {
      this._cachedHasFocusableChild = false;
      for (const child of this.children) {
        if (child._focusable || child._hasFocusableChild()) {
          this._cachedHasFocusableChild = true;
          break;
        }
      }
    }
    return this._cachedHasFocusableChild;
  }

  public find(predicate: (x: AXNode) => boolean): AXNode | null {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const result = child.find(predicate);
      if (result) return result;
    }
    return null;
  }

  public isLeafNode(): boolean {
    if (!this.children.length) return true;

    // These types of objects may have children that we use as internal
    // implementation details, but we want to expose them as leaves to platform
    // accessibility APIs because screen readers might be confused if they find
    // any children.
    if (this._isPlainTextField() || this._isTextOnlyObject()) return true;

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
    if (this._hasFocusableChild()) return false;
    if (this._focusable && this._name) return true;
    if (this._role === 'heading' && this._name) return true;
    return false;
  }

  public isControl(): boolean {
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
      case 'treeitem':
        return true;
      default:
        return false;
    }
  }

  public isInteresting(insideControl: boolean): boolean {
    const role = this._role;
    if (role === 'Ignored' || this._hidden || this._ignored) return false;

    if (this._focusable || this._richlyEditable) return true;

    // If it's not focusable but has a control role, then it's interesting.
    if (this.isControl()) return true;

    // A non focusable child of a control is not interesting
    if (insideControl) return false;

    return this.isLeafNode() && !!this._name;
  }

  public serialize(): SerializedAXNode {
    const properties = new Map<string, number | string | boolean>();
    for (const property of this.payload.properties || [])
      properties.set(property.name.toLowerCase(), property.value.value);
    if (this.payload.name) properties.set('name', this.payload.name.value);
    if (this.payload.value) properties.set('value', this.payload.value.value);
    if (this.payload.description)
      properties.set('description', this.payload.description.value);

    const node: SerializedAXNode = {
      role: this._role,
    };

    type UserStringProperty =
      | 'name'
      | 'value'
      | 'description'
      | 'keyshortcuts'
      | 'roledescription'
      | 'valuetext';

    const userStringProperties: UserStringProperty[] = [
      'name',
      'value',
      'description',
      'keyshortcuts',
      'roledescription',
      'valuetext',
    ];
    const getUserStringPropertyValue = (key: UserStringProperty): string =>
      properties.get(key) as string;

    for (const userStringProperty of userStringProperties) {
      if (!properties.has(userStringProperty)) continue;

      node[userStringProperty] = getUserStringPropertyValue(userStringProperty);
    }

    type BooleanProperty =
      | 'disabled'
      | 'expanded'
      | 'focused'
      | 'modal'
      | 'multiline'
      | 'multiselectable'
      | 'readonly'
      | 'required'
      | 'selected';
    const booleanProperties: BooleanProperty[] = [
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
    const getBooleanPropertyValue = (key: BooleanProperty): boolean =>
      properties.get(key) as boolean;

    for (const booleanProperty of booleanProperties) {
      // WebArea's treat focus differently than other nodes. They report whether
      // their frame  has focus, not whether focus is specifically on the root
      // node.
      if (booleanProperty === 'focused' && this._role === 'WebArea') continue;
      const value = getBooleanPropertyValue(booleanProperty);
      if (!value) continue;
      node[booleanProperty] = getBooleanPropertyValue(booleanProperty);
    }

    type TristateProperty = 'checked' | 'pressed';
    const tristateProperties: TristateProperty[] = ['checked', 'pressed'];
    for (const tristateProperty of tristateProperties) {
      if (!properties.has(tristateProperty)) continue;
      const value = properties.get(tristateProperty);
      node[tristateProperty] =
        value === 'mixed' ? 'mixed' : value === 'true' ? true : false;
    }

    type NumbericalProperty = 'level' | 'valuemax' | 'valuemin';
    const numericalProperties: NumbericalProperty[] = [
      'level',
      'valuemax',
      'valuemin',
    ];
    const getNumericalPropertyValue = (key: NumbericalProperty): number =>
      properties.get(key) as number;
    for (const numericalProperty of numericalProperties) {
      if (!properties.has(numericalProperty)) continue;
      node[numericalProperty] = getNumericalPropertyValue(numericalProperty);
    }

    type TokenProperty =
      | 'autocomplete'
      | 'haspopup'
      | 'invalid'
      | 'orientation';
    const tokenProperties: TokenProperty[] = [
      'autocomplete',
      'haspopup',
      'invalid',
      'orientation',
    ];
    const getTokenPropertyValue = (key: TokenProperty): string =>
      properties.get(key) as string;
    for (const tokenProperty of tokenProperties) {
      const value = getTokenPropertyValue(tokenProperty);
      if (!value || value === 'false') continue;
      node[tokenProperty] = getTokenPropertyValue(tokenProperty);
    }
    return node;
  }

  public static createTree(payloads: Protocol.Accessibility.AXNode[]): AXNode {
    const nodeById = new Map<string, AXNode>();
    for (const payload of payloads)
      nodeById.set(payload.nodeId, new AXNode(payload));
    for (const node of nodeById.values()) {
      for (const childId of node.payload.childIds || [])
        node.children.push(nodeById.get(childId));
    }
    return nodeById.values().next().value;
  }
}
