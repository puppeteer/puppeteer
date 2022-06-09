import { MouseButton } from '../Input.js';

/**
 * @public
 */
export interface Offset {
  /**
   * x-offset for the clickable point relative to the top-left corder of the border box.
   */
  x: number;
  /**
   * y-offset for the clickable point relative to the top-left corder of the border box.
   */
  y: number;
}

/**
 * @public
 */
export interface ClickOptions {
  /**
   * Time to wait between `mousedown` and `mouseup` in milliseconds.
   *
   * @defaultValue 0
   */
  delay?: number;
  /**
   * @defaultValue 'left'
   */
  button?: MouseButton;
  /**
   * @defaultValue 1
   */
  clickCount?: number;
  /**
   * Offset for the clickable point relative to the top-left corder of the border box.
   */
  offset?: Offset;
}

/**
 * @public
 */
export interface PressOptions {
  /**
   * Time to wait between `keydown` and `keyup` in milliseconds. Defaults to 0.
   */
  delay?: number;
  /**
   * If specified, generates an input event with this text.
   */
  text?: string;
}

/**
 * @public
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * @public
 */
export interface BoxModel {
  content: Point[];
  padding: Point[];
  border: Point[];
  margin: Point[];
  width: number;
  height: number;
}

/**
 * @public
 */
export interface BoundingBox extends Point {
  /**
   * the width of the element in pixels.
   */
  width: number;
  /**
   * the height of the element in pixels.
   */
  height: number;
}
