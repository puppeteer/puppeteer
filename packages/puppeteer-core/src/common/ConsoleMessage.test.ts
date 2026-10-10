/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {createConsoleMessage} from '../cdp/utils.js';

import {ConsoleMessage} from './ConsoleMessage.js';

describe('ConsoleMessage', () => {
  it('should include scriptId in location and stackTrace if provided', () => {
    const message = new ConsoleMessage(
      'log',
      'test message',
      [],
      [
        {
          url: 'http://example.com/script.js',
          lineNumber: 10,
          columnNumber: 5,
          scriptId: '42',
        },
      ],
    );
    expect(message.location()).toEqual({
      url: 'http://example.com/script.js',
      lineNumber: 10,
      columnNumber: 5,
      scriptId: '42',
    });
    expect(message.stackTrace()).toEqual([
      {
        url: 'http://example.com/script.js',
        lineNumber: 10,
        columnNumber: 5,
        scriptId: '42',
      },
    ]);
  });

  it('should extract scriptId from CDP stackTrace call frames', () => {
    const event = {
      type: 'log',
      args: [],
      executionContextId: 1,
      timestamp: 12345,
      stackTrace: {
        callFrames: [
          {
            functionName: 'dynamicFoo',
            scriptId: '4',
            url: '',
            lineNumber: 0,
            columnNumber: 32,
          },
        ],
      },
    } as any;

    const message = createConsoleMessage(event, []);
    expect(message.location()).toEqual({
      url: '',
      lineNumber: 0,
      columnNumber: 32,
      scriptId: '4',
    });
    expect(message.stackTrace()).toEqual([
      {
        url: '',
        lineNumber: 0,
        columnNumber: 32,
        scriptId: '4',
      },
    ]);
  });
});
