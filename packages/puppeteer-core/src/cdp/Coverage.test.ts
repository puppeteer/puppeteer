/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import type {CDPSessionEvents} from '../api/CDPSession.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {Deferred} from '../util/Deferred.js';

import {CSSCoverage, JSCoverage} from './Coverage.js';

class MockCDPSession extends EventEmitter<CDPSessionEvents> {
  onSend?: (method: string, params?: unknown) => Promise<unknown>;

  async send(method: string, params?: unknown): Promise<any> {
    if (this.onSend) {
      return await this.onSend(method, params);
    }
    return {};
  }
  connection() {
    return undefined;
  }
  readonly detached = false;
  async detach() {}
  id() {
    return '1';
  }
  parentSession() {
    return undefined;
  }
}

describe('Coverage', () => {
  describe('JSCoverage', () => {
    it('resets state and cleans up listeners when start() fails', async () => {
      const client = new MockCDPSession();
      let shouldFail = true;
      client.onSend = async method => {
        if (method === 'Profiler.startPreciseCoverage' && shouldFail) {
          throw new Error('Failed to start precise coverage');
        }
        return {result: []};
      };
      const coverage = new JSCoverage(client as never);

      await expect(coverage.start()).rejects.toThrow(
        'Failed to start precise coverage',
      );
      expect(client.listenerCount('Debugger.scriptParsed')).toBe(0);
      expect(client.listenerCount('Runtime.executionContextsCleared')).toBe(0);

      shouldFail = false;
      await coverage.start();
      const entries = await coverage.stop();
      expect(entries).toEqual([]);
      expect(client.listenerCount('Debugger.scriptParsed')).toBe(0);
      expect(client.listenerCount('Runtime.executionContextsCleared')).toBe(0);
    });

    it('cleans up listeners when stop() fails', async () => {
      const client = new MockCDPSession();
      client.onSend = async method => {
        if (method === 'Profiler.takePreciseCoverage') {
          throw new Error('Target closed');
        }
        return {};
      };
      const coverage = new JSCoverage(client as never);

      await coverage.start();
      await expect(coverage.stop()).rejects.toThrow('Target closed');
      expect(client.listenerCount('Debugger.scriptParsed')).toBe(0);
      expect(client.listenerCount('Runtime.executionContextsCleared')).toBe(0);

      await coverage.start();
    });

    it('ignores stale Debugger.getScriptSource responses after navigation reset', async () => {
      const client = new MockCDPSession();
      const staleSource = Deferred.create<{scriptSource: string}>();
      client.onSend = async (method, params: any) => {
        if (method === 'Debugger.getScriptSource') {
          if (params.scriptId === 'old-script') {
            return await staleSource.valueOrThrow();
          }
          return {scriptSource: 'console.log("new");'};
        }
        if (method === 'Profiler.takePreciseCoverage') {
          return {
            result: [
              {
                scriptId: 'old-script',
                url: 'https://example.com/old.js',
                functions: [],
              },
              {
                scriptId: 'new-script',
                url: 'https://example.com/new.js',
                functions: [],
              },
            ],
          };
        }
        return {};
      };
      const coverage = new JSCoverage(client as never);
      await coverage.start({resetOnNavigation: true});

      client.emit('Debugger.scriptParsed', {
        scriptId: 'old-script',
        url: 'https://example.com/old.js',
        startLine: 0,
        startColumn: 0,
        endLine: 0,
        endColumn: 10,
        executionContextId: 1,
        hash: 'h1',
        buildId: '',
      });
      client.emit('Runtime.executionContextsCleared', undefined);
      client.emit('Debugger.scriptParsed', {
        scriptId: 'new-script',
        url: 'https://example.com/new.js',
        startLine: 0,
        startColumn: 0,
        endLine: 0,
        endColumn: 10,
        executionContextId: 2,
        hash: 'h2',
        buildId: '',
      });

      staleSource.resolve({scriptSource: 'console.log("stale");'});
      await new Promise(resolve => {
        return setTimeout(resolve, 10);
      });

      const entries = await coverage.stop();
      expect(
        entries.map(entry => {
          return entry.url;
        }),
      ).toEqual(['https://example.com/new.js']);
    });
  });

  describe('CSSCoverage', () => {
    it('resets state and cleans up listeners when start() fails', async () => {
      const client = new MockCDPSession();
      let shouldFail = true;
      client.onSend = async method => {
        if (method === 'CSS.startRuleUsageTracking' && shouldFail) {
          throw new Error('Failed to start rule usage tracking');
        }
        return {ruleUsage: []};
      };
      const coverage = new CSSCoverage(client as never);

      await expect(coverage.start()).rejects.toThrow(
        'Failed to start rule usage tracking',
      );
      expect(client.listenerCount('CSS.styleSheetAdded')).toBe(0);
      expect(client.listenerCount('Runtime.executionContextsCleared')).toBe(0);

      shouldFail = false;
      await coverage.start();
      const entries = await coverage.stop();
      expect(entries).toEqual([]);
      expect(client.listenerCount('CSS.styleSheetAdded')).toBe(0);
      expect(client.listenerCount('Runtime.executionContextsCleared')).toBe(0);
    });

    it('cleans up listeners when stop() fails', async () => {
      const client = new MockCDPSession();
      client.onSend = async method => {
        if (method === 'CSS.stopRuleUsageTracking') {
          throw new Error('Target closed');
        }
        return {};
      };
      const coverage = new CSSCoverage(client as never);

      await coverage.start();
      await expect(coverage.stop()).rejects.toThrow('Target closed');
      expect(client.listenerCount('CSS.styleSheetAdded')).toBe(0);
      expect(client.listenerCount('Runtime.executionContextsCleared')).toBe(0);

      await coverage.start();
    });

    it('ignores stale CSS.getStyleSheetText responses after navigation reset', async () => {
      const client = new MockCDPSession();
      const staleText = Deferred.create<{text: string}>();
      client.onSend = async (method, params: any) => {
        if (method === 'CSS.getStyleSheetText') {
          if (params.styleSheetId === 'old-sheet') {
            return await staleText.valueOrThrow();
          }
          return {text: 'body { color: blue; }'};
        }
        if (method === 'CSS.stopRuleUsageTracking') {
          return {ruleUsage: []};
        }
        return {};
      };
      const coverage = new CSSCoverage(client as never);
      await coverage.start({resetOnNavigation: true});

      client.emit('CSS.styleSheetAdded', {
        header: {
          styleSheetId: 'old-sheet',
          frameId: 'f1',
          sourceURL: 'https://example.com/old.css',
          origin: 'regular',
          title: '',
          disabled: false,
          isInline: false,
          isMutable: false,
          isConstructed: false,
          startLine: 0,
          startColumn: 0,
          length: 10,
          endLine: 0,
          endColumn: 10,
        },
      });
      client.emit('Runtime.executionContextsCleared', undefined);
      client.emit('CSS.styleSheetAdded', {
        header: {
          styleSheetId: 'new-sheet',
          frameId: 'f1',
          sourceURL: 'https://example.com/new.css',
          origin: 'regular',
          title: '',
          disabled: false,
          isInline: false,
          isMutable: false,
          isConstructed: false,
          startLine: 0,
          startColumn: 0,
          length: 10,
          endLine: 0,
          endColumn: 10,
        },
      });

      staleText.resolve({text: 'body { color: red; }'});
      await new Promise(resolve => {
        return setTimeout(resolve, 10);
      });

      const entries = await coverage.stop();
      expect(
        entries.map(entry => {
          return entry.url;
        }),
      ).toEqual(['https://example.com/new.css']);
    });
  });
});
