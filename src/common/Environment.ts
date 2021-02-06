/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import { CreateConnectionTransport } from './ConnectionTransport.js';

export type DebugLogger = (...args: unknown[]) => void;

export interface CommonEnvironment {
  CreateWebSocketTransport?: CreateConnectionTransport;
  debug?: (prefix: string) => DebugLogger;
  fetch?: typeof import('node-fetch') | null;
  fs?: typeof import('fs') | null;
  path?: typeof import('path') | null;
}
const env: CommonEnvironment = {
  CreateWebSocketTransport: null,
  debug: null,
  fetch: null,
  fs: null,
  path: null,
};

export function setupEnvironment(e: CommonEnvironment = {}): CommonEnvironment {
  return Object.assign(env, e);
}

export default env;
