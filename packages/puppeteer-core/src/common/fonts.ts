/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Information about amount of glyphs that were rendered with given font.
 * See https://chromedevtools.github.io/devtools-protocol/tot/CSS/#type-PlatformFontUsage
 *
 * @public
 */
export interface PlatformFontUsage {
  /**
   * Font's family name reported by platform.
   */
  familyName: string;
  /**
   * Font's PostScript name reported by the platform.
   */
  postScriptName: string;
  /**
   * Indicates whether the font was downloaded or resolved locally.
   */
  isCustomFont: boolean;
  /**
   * Amount of glyphs that were rendered with this font.
   */
  glyphCount: number;
}
