/**
 * Copyright 2021 Google Inc. All rights reserved.
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

import { Protocol } from 'devtools-protocol';
import { CDPSession } from './Connection.js';
import { isNode } from '../environment.js';
import { helper } from './helper.js';
import { EventEmitter } from './EventEmitter.js';
import { FrameManager } from './FrameManager.js';

import type { Metric } from 'web-vitals';

export const WEBVITALS_EXECUTION_CONTEXT_NAME =
  '__puppeteer_web_vitals_context__';
export const WEBVITALS_BINDING_NAME = 'reportWebVitalsMetric';

export class WebVitals extends EventEmitter {
  private client: CDPSession;
  private frameManager: FrameManager;
  private identifier: Protocol.Page.ScriptIdentifier | null = null;

  /**
   * @internal
   */
  constructor(client: CDPSession, frameManager: FrameManager) {
    super();
    this.client = client;
    this.frameManager = frameManager;
  }

  async start(enabledMetrics?: string[]): Promise<void> {
    if (!isNode) {
      throw new Error(
        'Cannot enable Web Vitals reporting outside of Node.js environment.'
      );
    }

    const fs = await helper.importFSModule();
    const webVitalsScript = await fs.promises.readFile(
      __dirname +
      '/../../../../node_modules/web-vitals/dist/web-vitals.iife.js',
      { encoding: 'utf8' }
    );

    let source = `
      ${webVitalsScript};
      function reportMetrics(metric) {
        ${WEBVITALS_BINDING_NAME}(JSON.stringify(metric));
      }
    `;

    const availableMetrics = ['CLS', 'FCP', 'FID', 'LCP', 'TTFB'];
    for (const metric of availableMetrics) {
      if (!enabledMetrics || enabledMetrics.includes(metric)) {
        source += `\nwebVitals.get${metric}(reportMetrics);`;
      }
    }

    await this.client.send('Runtime.addBinding', {
      name: WEBVITALS_BINDING_NAME,
      executionContextName: WEBVITALS_EXECUTION_CONTEXT_NAME,
    });

    const { identifier } = await this.client.send(
      'Page.addScriptToEvaluateOnNewDocument',
      {
        source,
        worldName: WEBVITALS_EXECUTION_CONTEXT_NAME,
      }
    );

    this.identifier = identifier;
  }

  public async stop(): Promise<void> {
    if (!this.identifier) return;

    const identifier = this.identifier;
    this.identifier = null;
    await this.client.send('Page.removeScriptToEvaluateOnNewDocument', {
      identifier,
    });

    await this.client.send('Runtime.removeBinding', {
      name: WEBVITALS_BINDING_NAME,
    });
  }

  /**
   * @internal
   */
  interceptBindingCalled(event: Protocol.Runtime.BindingCalledEvent): boolean {
    const context = this.frameManager.executionContextById(
      event.executionContextId
    );

    if (
      context._contextName !== WEBVITALS_EXECUTION_CONTEXT_NAME ||
      event.name !== WEBVITALS_BINDING_NAME
    ) {
      return false;
    }

    // Only emit events if Web Vitals reporting has not been disabled yet.
    if (!this.identifier) {
      return true;
    }

    const payload: Metric = JSON.parse(event.payload);
    this.emit(payload.name, payload);
    return true;
  }
}
