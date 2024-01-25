/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ElementHandle} from '../api/ElementHandle.js';
import type {JSHandle} from '../api/JSHandle.js';

import type {LazyArg} from './LazyArg.js';

/**
 * @public
 */
export type AwaitablePredicate<T> = (value: T) => Awaitable<boolean>;

/**
 * @public
 */
export interface Moveable {
  /**
   * Moves the resource when 'using'.
   */
  move(): this;
}

/**
 * @internal
 */
export interface Disposed {
  get disposed(): boolean;
}

/**
 * @internal
 */
export interface BindingPayload {
  type: string;
  name: string;
  seq: number;
  args: unknown[];
  /**
   * Determines whether the arguments of the payload are trivial.
   */
  isTrivial: boolean;
}

/**
 * @internal
 */
export type AwaitableIterator<T> = Iterator<T> | AsyncIterator<T>;

/**
 * @public
 */
export type AwaitableIterable<T> = Iterable<T> | AsyncIterable<T>;

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
export type ElementFor<
  TagName extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap,
> = TagName extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[TagName]
  : TagName extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[TagName]
    : never;

/**
 * @public
 */
export type EvaluateFunc<T extends unknown[]> = (
  ...params: InnerParams<T>
) => Awaitable<unknown>;

/**
 * @public
 */
export type EvaluateFuncWith<V, T extends unknown[]> = (
  ...params: [V, ...InnerParams<T>]
) => Awaitable<unknown>;

/**
 * @public
 */
export type NodeFor<ComplexSelector extends string> =
  TypeSelectorOfComplexSelector<ComplexSelector> extends infer TypeSelector
    ? TypeSelector extends
        | keyof HTMLElementTagNameMap
        | keyof SVGElementTagNameMap
      ? ElementFor<TypeSelector>
      : Element
    : never;

type TypeSelectorOfComplexSelector<ComplexSelector extends string> =
  CompoundSelectorsOfComplexSelector<ComplexSelector> extends infer CompoundSelectors
    ? CompoundSelectors extends NonEmptyReadonlyArray<string>
      ? Last<CompoundSelectors> extends infer LastCompoundSelector
        ? LastCompoundSelector extends string
          ? TypeSelectorOfCompoundSelector<LastCompoundSelector>
          : never
        : never
      : unknown
    : never;

type TypeSelectorOfCompoundSelector<CompoundSelector extends string> =
  SplitWithDelemiters<
    CompoundSelector,
    BeginSubclassSelectorTokens
  > extends infer CompoundSelectorTokens
    ? CompoundSelectorTokens extends [infer TypeSelector, ...any[]]
      ? TypeSelector extends ''
        ? unknown
        : TypeSelector
      : never
    : never;

type Last<Arr extends NonEmptyReadonlyArray<unknown>> = Arr extends [
  infer Head,
  ...infer Tail,
]
  ? Tail extends NonEmptyReadonlyArray<unknown>
    ? Last<Tail>
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
      : never
    : never;

type SplitWithDelemiters<
  Input extends string,
  Delemiters extends readonly string[],
> = Delemiters extends [infer FirstDelemiter, ...infer RestDelemiters]
  ? FirstDelemiter extends string
    ? RestDelemiters extends readonly string[]
      ? FlatmapSplitWithDelemiters<Split<Input, FirstDelemiter>, RestDelemiters>
      : never
    : never
  : [Input];

type BeginSubclassSelectorTokens = ['.', '#', '[', ':'];

type CombinatorTokens = [' ', '>', '+', '~', '|', '|'];

type Drop<
  Arr extends readonly unknown[],
  Remove,
  Acc extends unknown[] = [],
> = Arr extends [infer Head, ...infer Tail]
  ? Head extends Remove
    ? Drop<Tail, Remove>
    : Drop<Tail, Remove, [...Acc, Head]>
  : Acc;

type FlatmapSplitWithDelemiters<
  Inputs extends readonly string[],
  Delemiters extends readonly string[],
  Acc extends string[] = [],
> = Inputs extends [infer FirstInput, ...infer RestInputs]
  ? FirstInput extends string
    ? RestInputs extends readonly string[]
      ? FlatmapSplitWithDelemiters<
          RestInputs,
          Delemiters,
          [...Acc, ...SplitWithDelemiters<FirstInput, Delemiters>]
        >
      : Acc
    : Acc
  : Acc;

type Split<
  Input extends string,
  Delimiter extends string,
  Acc extends string[] = [],
> = Input extends `${infer Prefix}${Delimiter}${infer Suffix}`
  ? Split<Suffix, Delimiter, [...Acc, Prefix]>
  : [...Acc, Input];
