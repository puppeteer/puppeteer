/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { helper, debugError, assert, PuppeteerEventListener } from './helper';
import Protocol from './protocol';
import { CDPSession } from './Connection';

import { EVALUATION_SCRIPT_URL } from './ExecutionContext';

interface CoverageEntry {
  url: string;
  text: string;
  ranges: Array<{ start: number; end: number }>;
}

export class Coverage {
  _jsCoverage: JSCoverage;
  _cssCoverage: CSSCoverage;

  constructor(client: CDPSession) {
    this._jsCoverage = new JSCoverage(client);
    this._cssCoverage = new CSSCoverage(client);
  }

  async startJSCoverage(options: {
    resetOnNavigation?: boolean;
    reportAnonymousScripts?: boolean;
  }): Promise<void> {
    return await this._jsCoverage.start(options);
  }

  async stopJSCoverage(): Promise<CoverageEntry[]> {
    return await this._jsCoverage.stop();
  }

  async startCSSCoverage(options: {
    resetOnNavigation?: boolean;
  }): Promise<void> {
    return await this._cssCoverage.start(options);
  }

  async stopCSSCoverage(): Promise<CoverageEntry[]> {
    return await this._cssCoverage.stop();
  }
}

class JSCoverage {
  _client: CDPSession;
  _enabled = false;
  _scriptURLs = new Map<string, string>();
  _scriptSources = new Map<string, string>();
  _eventListeners: PuppeteerEventListener[] = [];
  _resetOnNavigation = false;
  _reportAnonymousScripts = false;

  constructor(client: CDPSession) {
    this._client = client;
  }

  async start(
    options: {
      resetOnNavigation?: boolean;
      reportAnonymousScripts?: boolean;
    } = {}
  ): Promise<void> {
    assert(!this._enabled, 'JSCoverage is already enabled');
    const {
      resetOnNavigation = true,
      reportAnonymousScripts = false,
    } = options;
    this._resetOnNavigation = resetOnNavigation;
    this._reportAnonymousScripts = reportAnonymousScripts;
    this._enabled = true;
    this._scriptURLs.clear();
    this._scriptSources.clear();
    this._eventListeners = [
      helper.addEventListener(
        this._client,
        'Debugger.scriptParsed',
        this._onScriptParsed.bind(this)
      ),
      helper.addEventListener(
        this._client,
        'Runtime.executionContextsCleared',
        this._onExecutionContextsCleared.bind(this)
      ),
    ];
    await Promise.all([
      this._client.send('Profiler.enable'),
      this._client.send('Profiler.startPreciseCoverage', {
        callCount: false,
        detailed: true,
      }),
      this._client.send('Debugger.enable'),
      this._client.send('Debugger.setSkipAllPauses', { skip: true }),
    ]);
  }

  _onExecutionContextsCleared(): void {
    if (!this._resetOnNavigation) return;
    this._scriptURLs.clear();
    this._scriptSources.clear();
  }

  async _onScriptParsed(
    event: Protocol.Debugger.scriptParsedPayload
  ): Promise<void> {
    // Ignore puppeteer-injected scripts
    if (event.url === EVALUATION_SCRIPT_URL) return;
    // Ignore other anonymous scripts unless the reportAnonymousScripts option is true.
    if (!event.url && !this._reportAnonymousScripts) return;
    try {
      const response = await this._client.send('Debugger.getScriptSource', {
        scriptId: event.scriptId,
      });
      this._scriptURLs.set(event.scriptId, event.url);
      this._scriptSources.set(event.scriptId, response.scriptSource);
    } catch (error) {
      // This might happen if the page has already navigated away.
      debugError(error);
    }
  }

  async stop(): Promise<CoverageEntry[]> {
    assert(this._enabled, 'JSCoverage is not enabled');
    this._enabled = false;

    const result = await Promise.all<
      Protocol.Profiler.takePreciseCoverageReturnValue,
      Protocol.Profiler.stopPreciseCoverageReturnValue,
      Protocol.Profiler.disableReturnValue,
      Protocol.Debugger.disableReturnValue
    >([
      this._client.send('Profiler.takePreciseCoverage'),
      this._client.send('Profiler.stopPreciseCoverage'),
      this._client.send('Profiler.disable'),
      this._client.send('Debugger.disable'),
    ]);

    helper.removeEventListeners(this._eventListeners);

    const coverage = [];
    const profileResponse = result[0];

    for (const entry of profileResponse.result) {
      let url = this._scriptURLs.get(entry.scriptId);
      if (!url && this._reportAnonymousScripts)
        url = 'debugger://VM' + entry.scriptId;
      const text = this._scriptSources.get(entry.scriptId);
      if (text === undefined || url === undefined) continue;
      const flattenRanges = [];
      for (const func of entry.functions) flattenRanges.push(...func.ranges);
      const ranges = convertToDisjointRanges(flattenRanges);
      coverage.push({ url, ranges, text });
    }
    return coverage;
  }
}

class CSSCoverage {
  _client: CDPSession;
  _enabled = false;
  _stylesheetURLs = new Map<string, string>();
  _stylesheetSources = new Map<string, string>();
  _eventListeners: PuppeteerEventListener[] = [];
  _resetOnNavigation = false;
  _reportAnonymousScripts = false;

  constructor(client: CDPSession) {
    this._client = client;
  }

  async start(options: { resetOnNavigation?: boolean } = {}): Promise<void> {
    assert(!this._enabled, 'CSSCoverage is already enabled');
    const { resetOnNavigation = true } = options;
    this._resetOnNavigation = resetOnNavigation;
    this._enabled = true;
    this._stylesheetURLs.clear();
    this._stylesheetSources.clear();
    this._eventListeners = [
      helper.addEventListener(
        this._client,
        'CSS.styleSheetAdded',
        this._onStyleSheet.bind(this)
      ),
      helper.addEventListener(
        this._client,
        'Runtime.executionContextsCleared',
        this._onExecutionContextsCleared.bind(this)
      ),
    ];
    await Promise.all([
      this._client.send('DOM.enable'),
      this._client.send('CSS.enable'),
      this._client.send('CSS.startRuleUsageTracking'),
    ]);
  }

  _onExecutionContextsCleared(): void {
    if (!this._resetOnNavigation) return;
    this._stylesheetURLs.clear();
    this._stylesheetSources.clear();
  }

  async _onStyleSheet(
    event: Protocol.CSS.styleSheetAddedPayload
  ): Promise<void> {
    const header = event.header;
    // Ignore anonymous scripts
    if (!header.sourceURL) return;
    try {
      const response = await this._client.send('CSS.getStyleSheetText', {
        styleSheetId: header.styleSheetId,
      });
      this._stylesheetURLs.set(header.styleSheetId, header.sourceURL);
      this._stylesheetSources.set(header.styleSheetId, response.text);
    } catch (error) {
      // This might happen if the page has already navigated away.
      debugError(error);
    }
  }

  async stop(): Promise<CoverageEntry[]> {
    assert(this._enabled, 'CSSCoverage is not enabled');
    this._enabled = false;
    const ruleTrackingResponse = await this._client.send(
      'CSS.stopRuleUsageTracking'
    );
    await Promise.all([
      this._client.send('CSS.disable'),
      this._client.send('DOM.disable'),
    ]);
    helper.removeEventListeners(this._eventListeners);

    // aggregate by styleSheetId
    const styleSheetIdToCoverage = new Map();
    for (const entry of ruleTrackingResponse.ruleUsage) {
      let ranges = styleSheetIdToCoverage.get(entry.styleSheetId);
      if (!ranges) {
        ranges = [];
        styleSheetIdToCoverage.set(entry.styleSheetId, ranges);
      }
      ranges.push({
        startOffset: entry.startOffset,
        endOffset: entry.endOffset,
        count: entry.used ? 1 : 0,
      });
    }

    const coverage = [];
    for (const styleSheetId of this._stylesheetURLs.keys()) {
      const url = this._stylesheetURLs.get(styleSheetId);
      const text = this._stylesheetSources.get(styleSheetId);
      const ranges = convertToDisjointRanges(
        styleSheetIdToCoverage.get(styleSheetId) || []
      );
      coverage.push({ url, ranges, text });
    }

    return coverage;
  }
}

function convertToDisjointRanges(
  nestedRanges: Array<{ startOffset: number; endOffset: number; count: number }>
): Array<{ start: number; end: number }> {
  const points = [];
  for (const range of nestedRanges) {
    points.push({ offset: range.startOffset, type: 0, range });
    points.push({ offset: range.endOffset, type: 1, range });
  }
  // Sort points to form a valid parenthesis sequence.
  points.sort((a, b) => {
    // Sort with increasing offsets.
    if (a.offset !== b.offset) return a.offset - b.offset;
    // All "end" points should go before "start" points.
    if (a.type !== b.type) return b.type - a.type;
    const aLength = a.range.endOffset - a.range.startOffset;
    const bLength = b.range.endOffset - b.range.startOffset;
    // For two "start" points, the one with longer range goes first.
    if (a.type === 0) return bLength - aLength;
    // For two "end" points, the one with shorter range goes first.
    return aLength - bLength;
  });

  const hitCountStack = [];
  const results = [];
  let lastOffset = 0;
  // Run scanning line to intersect all ranges.
  for (const point of points) {
    if (
      hitCountStack.length &&
      lastOffset < point.offset &&
      hitCountStack[hitCountStack.length - 1] > 0
    ) {
      const lastResult = results.length ? results[results.length - 1] : null;
      if (lastResult && lastResult.end === lastOffset)
        lastResult.end = point.offset;
      else results.push({ start: lastOffset, end: point.offset });
    }
    lastOffset = point.offset;
    if (point.type === 0) hitCountStack.push(point.range.count);
    else hitCountStack.pop();
  }
  // Filter out empty ranges.
  return results.filter((range) => range.end - range.start > 1);
}
