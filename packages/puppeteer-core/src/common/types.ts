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

import {JSHandle} from './JSHandle.js';
import {ElementHandle} from './ElementHandle.js';
import {LazyArg} from './LazyArg.js';

/**
 * @public
 */
export type Awaitable<T> = T | PromiseLike<T>;

/**
 * @public
 */
export type HandleFor<T> = T extends Node ? ElementHandle<T> : JSHandle<T>;

/**
 * @public
 */
export type HandleOr<T> = HandleFor<T> | JSHandle<T> | T;

/**
 * @public
 */
export type FlattenHandle<T> = T extends HandleOr<infer U> ? U : never;

/**
 * @internal
 */
export type FlattenLazyArg<T> = T extends LazyArg<infer U> ? U : T;

/**
 * @internal
 */
export type InnerLazyParams<T extends unknown[]> = {
  [K in keyof T]: FlattenLazyArg<T[K]>;
};

/**
 * @public
 */
export type InnerParams<T extends unknown[]> = {
  [K in keyof T]: FlattenHandle<T[K]>;
};

/**
 * @public
 */
export type EvaluateFunc<T extends unknown[]> = (
  ...params: InnerParams<T>
) => Awaitable<unknown>;

/**
 * @public
 */
export type NodeFor<ComplexSelector extends string> =
  TypeSelectorOfCamplexSelector<ComplexSelector> extends infer TypeSelector
    ? TypeSelector extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[TypeSelector]
      : TypeSelector extends keyof SVGElementTagNameMap
      ? SVGElementTagNameMap[TypeSelector]
      : Element
    : never;

type TypeSelectorOfCamplexSelector<ComplexSelector extends string> =
  CompoundSelectorsOfComplexSelector<ComplexSelector> extends infer CompoundSelectors
    ? CompoundSelectors extends NonEmptyReadonlyArray<string>
      ? LastArrayElement<CompoundSelectors> extends infer LastCompoundSelector
        ? LastCompoundSelector extends string
          ? TypeSelectorOfCompoundSelector<LastCompoundSelector>
          : void
        : never
      : void
    : never;

type TypeSelectorOfCompoundSelector<CompoundSelector extends string> =
  SplitWithDelemiters<
    CompoundSelector,
    BeginSubclassSelectorTokens
  > extends infer CompoundSelectorTokens
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      CompoundSelectorTokens extends [infer TypeSelector, ...infer _]
      ? TypeSelector extends ''
        ? void
        : TypeSelector
      : void
    : never;

type LastArrayElement<Arr extends NonEmptyReadonlyArray<unknown>> = Arr extends [
  infer Head,
  ...infer Tail
]
  ? Tail extends NonEmptyReadonlyArray<unknown>
    ? LastArrayElement<Tail>
    : Head
  : never;

type NonEmptyReadonlyArray<T> = [T, ...(readonly T[])];

type CompoundSelectorsOfComplexSelector<ComplexSelector extends string> =
  SplitWithDelemiters<
    ComplexSelector,
    CombinatorTokens
  > extends infer IntermediateTokens
    ? IntermediateTokens extends readonly string[]
      ? Drop<IntermediateTokens, ''>
      : void
    : never;

type SplitWithDelemiters<
  Input extends string,
  Delemiters extends readonly string[]
> = Delemiters extends [infer FirstDelemiter, ...infer RestDelemiters]
  ? FirstDelemiter extends string
    ? RestDelemiters extends readonly string[]
      ? FlatmapSplitWithDelemiters<Split<Input, FirstDelemiter>, RestDelemiters>
      : never
    : never
  : [Input];

type BeginSubclassSelectorTokens = ['.', '#', '[', ':'];

type CombinatorTokens = [' ', '>', '+', '~', '|', '|'];

type Drop<Arr extends readonly unknown[], Remove> = Arr extends [
  infer Head,
  ...infer Tail
]
  ? Head extends Remove
    ? Drop<Tail, Remove>
    : [Head, ...Drop<Tail, Remove>]
  : [];

type FlatmapSplitWithDelemiters<
  Inputs extends readonly string[],
  Delemiters extends readonly string[]
> = Inputs extends [infer FirstInput, ...infer RestInputs]
  ? FirstInput extends string
    ? RestInputs extends readonly string[]
      ? [
          ...SplitWithDelemiters<FirstInput, Delemiters>,
          ...FlatmapSplitWithDelemiters<RestInputs, Delemiters>
        ]
      : never
    : never
  : [];

type Split<
  Input extends string,
  Delemiter extends string
> = Input extends `${infer Prefix}${Delemiter}${infer Suffix}`
  ? [Prefix, ...Split<Suffix, Delemiter>]
  : [Input];
