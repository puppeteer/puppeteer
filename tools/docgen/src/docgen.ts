/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {ApiModel} from '@microsoft/api-extractor-model';

import {MarkdownDocumenter} from './custom_markdown_documenter.js';

export function docgen(jsonPath: string, outputDir: string): void {
  const apiModel = new ApiModel();
  apiModel.loadPackage(jsonPath);

  const markdownDocumenter: MarkdownDocumenter = new MarkdownDocumenter({
    apiModel: apiModel,
    documenterConfig: undefined,
    outputFolder: outputDir,
  });
  markdownDocumenter.generateFiles();
}

export function spliceIntoSection(
  sectionName: string,
  content: string,
  sectionContent: string,
): string {
  const lines = content.split('\n');
  const offset =
    lines.findIndex(line => {
      return line.includes(`<!-- ${sectionName}-start -->`);
    }) + 1;
  const limit = lines.slice(offset).findIndex(line => {
    return line.includes(`<!-- ${sectionName}-end -->`);
  });
  lines.splice(offset, limit, ...sectionContent.split('\n'));
  return lines.join('\n');
}
