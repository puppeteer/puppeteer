/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import type {Protocol} from 'devtools-protocol';
import expect from 'expect';

import type {ElementHandle} from '../api/ElementHandle.js';
import type {Realm} from '../api/Realm.js';
import {disposeSymbol} from '../util/disposable.js';

import {Accessibility, type SnapshotOptions} from './Accessibility.js';

function createAXNode(
  nodeId: string,
  role: string,
  childIds: string[] = [],
  backendDOMNodeId?: number,
  name?: string,
): Protocol.Accessibility.AXNode {
  return {
    nodeId,
    ignored: false,
    role: {type: 'role', value: role},
    ...(name !== undefined
      ? {name: {type: 'computedString', value: name}}
      : {}),
    childIds,
    ...(backendDOMNodeId !== undefined ? {backendDOMNodeId} : {}),
  };
}

describe('Accessibility', () => {
  it('omits root when populating nested iframe snapshots', async () => {
    const childSnapshotCalls: SnapshotOptions[] = [];
    const childAccessibility = {
      snapshot: async (options: SnapshotOptions = {}) => {
        childSnapshotCalls.push(options);
        return {
          role: 'RootWebArea',
          name: '',
          loaderId: 'child-loader',
          elementHandle: async () => {
            return null;
          },
          children: [
            {
              role: 'button',
              name: 'Inside',
              loaderId: 'child-loader',
              elementHandle: async () => {
                return null;
              },
            },
          ],
        };
      },
    };
    const mockRealm = {
      environment: {
        _loaderId: 'main-loader',
        client: {
          send: async (method: string) => {
            if (method === 'Accessibility.getFullAXTree') {
              return {
                nodes: [
                  createAXNode('root', 'RootWebArea', ['region']),
                  createAXNode('region', 'region', ['iframe'], 10, 'Box'),
                  createAXNode('iframe', 'Iframe', [], 20),
                ],
              };
            }
            if (method === 'DOM.describeNode') {
              return {node: {backendNodeId: 10}};
            }
            throw new Error(`Unexpected CDP method: ${method}`);
          },
        },
      },
      adoptBackendNode: async () => {
        return {
          contentFrame: async () => {
            return {accessibility: childAccessibility};
          },
          [disposeSymbol]: () => {},
        };
      },
    } as unknown as Realm;

    using rootHandle = {
      id: 'obj-10',
      [disposeSymbol]: () => {},
    } as unknown as ElementHandle<Node>;
    const accessibility = new Accessibility(mockRealm);
    const snapshot = await accessibility.snapshot({
      root: rootHandle,
      includeIframes: true,
      interestingOnly: true,
    });

    expect(childSnapshotCalls).toEqual([
      {interestingOnly: true, includeIframes: true},
    ]);
    expect(snapshot).toMatchObject({
      role: 'region',
      name: 'Box',
      children: [
        {
          role: 'Iframe',
          children: [
            {
              role: 'RootWebArea',
              children: [{role: 'button', name: 'Inside'}],
            },
          ],
        },
      ],
    });
  });

  it('skips iframes outside the root subtree and misses', async () => {
    const adoptedBackendNodeIds: number[] = [];
    const childAccessibility = {
      snapshot: async () => {
        return {
          role: 'RootWebArea',
          name: '',
          loaderId: 'child-loader',
          elementHandle: async () => {
            return null;
          },
        };
      },
    };
    let describedBackendNodeId = 10;
    const mockRealm = {
      environment: {
        _loaderId: 'main-loader',
        client: {
          send: async (method: string) => {
            if (method === 'Accessibility.getFullAXTree') {
              return {
                nodes: [
                  createAXNode('root', 'RootWebArea', [
                    'outside-iframe',
                    'target-region',
                  ]),
                  createAXNode('outside-iframe', 'Iframe', [], 99),
                  createAXNode(
                    'target-region',
                    'region',
                    ['inside-iframe'],
                    10,
                  ),
                  createAXNode('inside-iframe', 'Iframe', [], 20),
                ],
              };
            }
            if (method === 'DOM.describeNode') {
              return {node: {backendNodeId: describedBackendNodeId}};
            }
            throw new Error(`Unexpected CDP method: ${method}`);
          },
        },
      },
      adoptBackendNode: async (backendNodeId: number) => {
        adoptedBackendNodeIds.push(backendNodeId);
        return {
          contentFrame: async () => {
            return {accessibility: childAccessibility};
          },
          [disposeSymbol]: () => {},
        };
      },
    } as unknown as Realm;

    using rootHandle = {
      id: 'obj-10',
      [disposeSymbol]: () => {},
    } as unknown as ElementHandle<Node>;
    const accessibility = new Accessibility(mockRealm);

    await accessibility.snapshot({root: rootHandle, includeIframes: true});
    expect(adoptedBackendNodeIds).toEqual([20]);

    adoptedBackendNodeIds.length = 0;
    describedBackendNodeId = 999;
    const missing = await accessibility.snapshot({
      root: rootHandle,
      includeIframes: true,
    });
    expect(missing).toBeNull();
    expect(adoptedBackendNodeIds).toEqual([]);
  });

  it('ignores detached iframe errors from adoptBackendNode', async () => {
    const logged: unknown[] = [];
    const mockRealm = {
      environment: {
        _loaderId: 'main-loader',
        client: {
          send: async () => {
            return {
              nodes: [
                createAXNode('root', 'RootWebArea', ['button', 'iframe']),
                createAXNode('button', 'button', [], 30, 'Ok'),
                createAXNode('iframe', 'Iframe', [], 20),
              ],
            };
          },
        },
      },
      adoptBackendNode: async () => {
        throw new Error('Protocol error (DOM.resolveNode): No node found');
      },
    } as unknown as Realm;

    const accessibility = new Accessibility(mockRealm, '', () => {
      return error => {
        logged.push(error);
      };
    });
    const snapshot = await accessibility.snapshot({
      includeIframes: true,
      interestingOnly: false,
    });

    expect(snapshot).toMatchObject({
      role: 'RootWebArea',
      children: [{role: 'button', name: 'Ok'}, {role: 'Iframe'}],
    });
    expect(logged).toHaveLength(1);
  });
});
