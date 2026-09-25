/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import {assert} from 'chai';

import {parsePSelectors} from './PSelectorParser.js';

describe('PSelectorParser', () => {
  describe('parsePSelectors', () => {
    it('parses nested selectors', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] =
        parsePSelectors('& > div');
      assert.deepEqual(updatedSelector, [[['&>div']]]);
      assert.ok(isPureCSS);
      assert.notOk(hasPseudoClasses);
    });

    it('parses nested selectors with p-selector syntax', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] =
        parsePSelectors('& > div >>> button');
      assert.deepEqual<unknown>(updatedSelector, [
        [['&>div'], '>>>', ['button']],
      ]);
      assert.notOk(isPureCSS);
      assert.notOk(hasPseudoClasses);
    });

    it('parses selectors with pseudo classes', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] =
        parsePSelectors('div:focus');
      assert.deepEqual(updatedSelector, [[['div:focus']]]);
      assert.ok(isPureCSS);
      assert.ok(hasPseudoClasses);
    });

    it('parses nested selectors with pseudo classes and p-selector syntax', () => {
      const [updatedSelector, isPureCSS, hasPseudoClasses] = parsePSelectors(
        '& > div:focus >>>> button:focus',
      );
      assert.deepEqual<unknown>(updatedSelector, [
        [['&>div:focus'], '>>>>', ['button:focus']],
      ]);
      assert.notOk(isPureCSS);
      assert.ok(hasPseudoClasses);
    });

    describe('hasAria', () => {
      it('returns false if no aria query is present', () => {
        const [, , , hasAria] = parsePSelectors('div:focus');
        assert.isFalse(hasAria);
      });
      it('returns true if an aria query is present', () => {
        const [, , , hasAria] = parsePSelectors(
          'div:focus >>> ::-p-aria(Text)',
        );
        assert.isTrue(hasAria);
      });
    });
  });
});
