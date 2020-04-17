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


/* This is a poor typed implementation of promisify. It would be much
 * nicer to use util.promisfy from Node but we need it to work in the
 * browser as we bundle via Browserify and Browserify doesn't seem to
 * bundle the util module when it does. The long term goal for our web
 * bundle isn't to use Browserify but something more modern (probably
 * Rollup?) and so rather than delay the TypeScript migration with a big
 * tangent around web bundling we'll use this for now and loop back once
 * src/ is 100% TypeScript.
 *
 * TODO (jacktfranklin@) swap this for util.promisify so we get much
 * better type support from TypeScript
 */

type CallbackFunc = (...args: any[]) => void;
type PromisifiedFunc = (...args: any[]) => Promise<any>;

function promisify<ResultType extends any>(func: CallbackFunc): PromisifiedFunc {
  function promisified(...args): Promise<ResultType | ResultType[]> {
    return new Promise((resolve, reject) => {
      function callback(err: Error | null, ...result: ResultType[]): void {
        if (err)
          return reject(err);
        if (result.length === 1)
          return resolve(result[0]);
        return resolve(result);
      }
      func.call(null, ...args, callback);
    });
  }

  return promisified;
}

export = promisify;
