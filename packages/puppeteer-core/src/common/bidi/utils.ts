/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {debug} from '../Debug.js';

import {Context} from './Context.js';

/**
 * @internal
 */
export const debugError = debug('puppeteer:error');
/**
 * @internal
 */
export async function releaseReference(
  client: Context,
  remoteReference: Bidi.CommonDataTypes.RemoteReference
): Promise<void> {
  if (!remoteReference.handle) {
    return;
  }
  await client.connection
    .send('script.disown', {
      target: {context: client._contextId},
      handles: [remoteReference.handle],
    })
    .catch((error: any) => {
      // Exceptions might happen in case of a page been navigated or closed.
      // Swallow these since they are harmless and we don't leak anything in this case.
      debugError(error);
    });
}
