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

import {helper, assert} from './helper';
import { CDPSession } from './Connection';

export class Tracing {
  private _recording: boolean
  private _path: string | null

  constructor(private client: CDPSession) {
    this._recording = false;
    this._path = '';
  }

  async start(options: {path?: string, screenshots?: boolean, categories?: string[]} = {}):Promise<void> {
    assert(!this._recording, 'Cannot start recording trace while already recording trace.');

    const defaultCategories = [
      '-*', 'devtools.timeline', 'v8.execute', 'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame', 'toplevel',
      'blink.console', 'blink.user_timing', 'latencyInfo', 'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.cpu_profiler', 'disabled-by-default-v8.cpu_profiler.hires'
    ];
    const {
      path = null,
      screenshots = false,
      categories = defaultCategories,
    } = options;

    if (screenshots)
      categories.push('disabled-by-default-devtools.screenshot');

    this._path = path;
    this._recording = true;
    await this.client.send('Tracing.start', {
      transferMode: 'ReturnAsStream',
      categories: categories.join(',')
    });
  }

  async stop(): Promise<Buffer | null> {
    let fulfill: (value?: Buffer | null) => void;
    const contentPromise = new Promise<Buffer | null>(x => fulfill = x);
    this.client.once('Tracing.tracingComplete', event => {
      helper.readProtocolStream(this.client, event.stream, this._path).then(fulfill);
    });
    await this.client.send('Tracing.end');
    this._recording = false;
    return contentPromise;
  }
}
