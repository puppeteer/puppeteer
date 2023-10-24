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
export {
  bufferCount,
  catchError,
  concatMap,
  defaultIfEmpty,
  defer,
  delay,
  EMPTY,
  filter,
  first,
  firstValueFrom,
  forkJoin,
  from,
  fromEvent,
  identity,
  ignoreElements,
  lastValueFrom,
  map,
  merge,
  mergeMap,
  NEVER,
  noop,
  of,
  pipe,
  race,
  raceWith,
  retry,
  startWith,
  switchMap,
  takeUntil,
  tap,
  throwIfEmpty,
  timer,
} from 'rxjs';

export type * from 'rxjs';

import {filter, from, map, mergeMap, type Observable} from 'rxjs';

export function filterAsync<T>(
  predicate: (value: T) => boolean | PromiseLike<boolean>
) {
  return mergeMap<T, Observable<T>>(value => {
    return from(Promise.resolve(predicate(value))).pipe(
      filter(isMatch => {
        return isMatch;
      }),
      map(() => {
        return value;
      })
    );
  });
}
