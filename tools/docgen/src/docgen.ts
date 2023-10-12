/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
  sectionContent: string
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
