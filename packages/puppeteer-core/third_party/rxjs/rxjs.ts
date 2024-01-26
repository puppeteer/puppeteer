/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
export {
  bufferCount,
  catchError,
  concat,
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
  Observable,
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
  zip,
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
