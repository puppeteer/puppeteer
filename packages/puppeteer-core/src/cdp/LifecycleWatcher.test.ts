/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {PageEvent} from '../api/Page.js';
import {EventEmitter} from '../common/EventEmitter.js';

import type {CdpFrame} from './Frame.js';
import {LifecycleWatcher} from './LifecycleWatcher.js';
import type {NetworkManager} from './NetworkManager.js';

describe('LifecycleWatcher', () => {
  function createMockFrame() {
    const page = new EventEmitter();
    const frameManager = new EventEmitter();
    const networkManager = new EventEmitter() as unknown as NetworkManager;
    const frame = Object.assign(new EventEmitter(), {
      _loaderId: 'loader-1',
      _frameManager: frameManager,
      _lifecycleEvents: new Set<string>(),
      childFrames() {
        return [];
      },
      page() {
        return page;
      },
    }) as unknown as CdpFrame;
    return {page, networkManager, frame};
  }

  it('terminates navigation immediately when the page crashes', async () => {
    const {page, networkManager, frame} = createMockFrame();
    const watcher = new LifecycleWatcher(networkManager, frame, 'load', 30_000);

    const crashError = new Error('Page crashed!');
    page.emit(PageEvent.Error, crashError);

    await expect(watcher.terminationPromise()).resolves.toBe(crashError);
    watcher.dispose();
  });

  it('removes the page error listener when disposed without a crash', () => {
    const {page, networkManager, frame} = createMockFrame();
    const watcher = new LifecycleWatcher(networkManager, frame, 'load', 30_000);

    expect(page.listenerCount(PageEvent.Error)).toBe(1);
    watcher.dispose();
    expect(page.listenerCount(PageEvent.Error)).toBe(0);
  });
});
