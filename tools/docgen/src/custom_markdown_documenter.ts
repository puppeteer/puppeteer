/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the
// MIT license. See LICENSE in the project root for license information.

// Taken from
// https://github.com/microsoft/rushstack/blob/main/apps/api-documenter/src/documenters/MarkdownDocumenter.ts
// This file has been edited to morph into Docusaurus's expected inputs.

import * as path from 'path';

import type {DocumenterConfig} from '@microsoft/api-documenter/lib/documenters/DocumenterConfig.js';
import {CustomMarkdownEmitter as ApiFormatterMarkdownEmitter} from '@microsoft/api-documenter/lib/markdown/CustomMarkdownEmitter.js';
import {CustomDocNodes} from '@microsoft/api-documenter/lib/nodes/CustomDocNodeKind.js';
import {DocEmphasisSpan} from '@microsoft/api-documenter/lib/nodes/DocEmphasisSpan.js';
import {DocHeading} from '@microsoft/api-documenter/lib/nodes/DocHeading.js';
import {DocNoteBox} from '@microsoft/api-documenter/lib/nodes/DocNoteBox.js';
import {DocTable} from '@microsoft/api-documenter/lib/nodes/DocTable.js';
import {DocTableCell} from '@microsoft/api-documenter/lib/nodes/DocTableCell.js';
import {DocTableRow} from '@microsoft/api-documenter/lib/nodes/DocTableRow.js';
import {MarkdownDocumenterAccessor} from '@microsoft/api-documenter/lib/plugin/MarkdownDocumenterAccessor.js';
import {
  type IMarkdownDocumenterFeatureOnBeforeWritePageArgs,
  MarkdownDocumenterFeatureContext,
} from '@microsoft/api-documenter/lib/plugin/MarkdownDocumenterFeature.js';
import {PluginLoader} from '@microsoft/api-documenter/lib/plugin/PluginLoader.js';
import {Utilities} from '@microsoft/api-documenter/lib/utils/Utilities.js';
import {
  ApiClass,
  ApiDeclaredItem,
  ApiDocumentedItem,
  type ApiEnum,
  ApiInitializerMixin,
  ApiInterface,
  type ApiItem,
  ApiItemKind,
  type ApiModel,
  type ApiNamespace,
  ApiOptionalMixin,
  type ApiPackage,
  ApiParameterListMixin,
  ApiPropertyItem,
  ApiProtectedMixin,
  ApiReadonlyMixin,
  ApiReleaseTagMixin,
  ApiReturnTypeMixin,
  ApiStaticMixin,
  ApiTypeAlias,
  type Excerpt,
  type ExcerptToken,
  ExcerptTokenKind,
  type IResolveDeclarationReferenceResult,
  ReleaseTag,
} from '@microsoft/api-extractor-model';
import {
  type DocBlock,
  DocCodeSpan,
  type DocComment,
  DocFencedCode,
  DocLinkTag,
  type DocNodeContainer,
  DocNodeKind,
  DocParagraph,
  DocPlainText,
  DocSection,
  StandardTags,
  StringBuilder,
  DocHtmlStartTag,
  DocHtmlEndTag,
  DocHtmlAttribute,
  type TSDocConfiguration,
} from '@microsoft/tsdoc';
import {
  FileSystem,
  NewlineKind,
  PackageName,
} from '@rushstack/node-core-library';

export interface IMarkdownDocumenterOptions {
  apiModel: ApiModel;
  documenterConfig: DocumenterConfig | undefined;
  outputFolder: string;
}

export class CustomMarkdownEmitter extends ApiFormatterMarkdownEmitter {
  protected override getEscapedText(text: string): string {
    const textWithBackslashes = text
      .replace(/\\/g, '\\\\') // first replace the escape character
      .replace(/[*#[\]_|`~]/g, x => {
        return '\\' + x;
      }) // then escape any special characters
      .replace(/---/g, '\\-\\-\\-') // hyphens only if it's 3 or more
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\{/g, '&#123;')
      .replace(/\}/g, '&#125;');
    return textWithBackslashes;
  }
}

/**
 * Renders API documentation in the Markdown file format.
 * For more info: https://en.wikipedia.org/wiki/Markdown
 */
export class MarkdownDocumenter {
  private readonly _apiModel: ApiModel;
  private readonly _documenterConfig: DocumenterConfig | undefined;
  private readonly _tsdocConfiguration: TSDocConfiguration;
  private readonly _markdownEmitter: CustomMarkdownEmitter;
  private readonly _outputFolder: string;
  private readonly _pluginLoader: PluginLoader;

  public constructor(options: IMarkdownDocumenterOptions) {
    this._apiModel = options.apiModel;
    this._documenterConfig = options.documenterConfig;
    this._outputFolder = options.outputFolder;
    this._tsdocConfiguration = CustomDocNodes.configuration;
    this._markdownEmitter = new CustomMarkdownEmitter(this._apiModel);

    this._pluginLoader = new PluginLoader();
  }

  public generateFiles(): void {
    if (this._documenterConfig) {
      this._pluginLoader.load(this._documenterConfig, () => {
        return new MarkdownDocumenterFeatureContext({
          apiModel: this._apiModel,
          outputFolder: this._outputFolder,
          documenter: new MarkdownDocumenterAccessor({
            getLinkForApiItem: (apiItem: ApiItem) => {
              return this._getLinkFilenameForApiItem(apiItem);
            },
          }),
        });
      });
    }

    this._deleteOldOutputFiles();

    this._writeApiItemPage(this._apiModel.members[0]!);

    if (this._pluginLoader.markdownDocumenterFeature) {
      this._pluginLoader.markdownDocumenterFeature.onFinished({});
    }
  }

  private _getBaseApiItemPage(apiItem: ApiItem): DocSection {
    const configuration = this._tsdocConfiguration;
    const output = new DocSection({
      configuration,
    });

    const scopedName = apiItem.getScopedNameWithinPackage();
    switch (apiItem.kind) {
      case ApiItemKind.Class:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} class`}),
        );
        break;
      case ApiItemKind.Enum:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} enum`}),
        );
        break;
      case ApiItemKind.Interface:
        output.appendNode(
          new DocHeading({
            configuration,
            title: `${scopedName} interface`,
          }),
        );
        break;
      case ApiItemKind.Constructor:
      case ApiItemKind.ConstructSignature:
        output.appendNode(new DocHeading({configuration, title: scopedName}));
        break;
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} method`}),
        );
        break;
      case ApiItemKind.Function:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} function`}),
        );
        break;
      case ApiItemKind.Model:
        output.appendNode(
          new DocHeading({configuration, title: `API Reference`}),
        );
        break;
      case ApiItemKind.Namespace:
        output.appendNode(
          new DocHeading({
            configuration,
            title: `${scopedName} namespace`,
          }),
        );
        break;
      case ApiItemKind.Package:
        console.log(`Writing ${apiItem.displayName} package`);
        output.appendNode(
          new DocHeading({
            configuration,
            title: `API Reference`,
          }),
        );
        break;
      case ApiItemKind.Property:
      case ApiItemKind.PropertySignature:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} property`}),
        );
        break;
      case ApiItemKind.TypeAlias:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} type`}),
        );
        break;
      case ApiItemKind.Variable:
        output.appendNode(
          new DocHeading({configuration, title: `${scopedName} variable`}),
        );
        break;
      default:
        throw new Error('Unsupported API item kind: ' + apiItem.kind);
    }

    return output;
  }

  private _getApiItemPage(apiItem: ApiItem): DocSection {
    const configuration = this._tsdocConfiguration;
    const output = new DocSection({
      configuration,
    });

    if (
      apiItem instanceof ApiDeclaredItem &&
      apiItem.excerpt.text.length > 0 &&
      ApiParameterListMixin.isBaseClassOf(apiItem) &&
      ApiReturnTypeMixin.isBaseClassOf(apiItem) &&
      apiItem.getMergedSiblings().length > 1
    ) {
      const name = apiItem.displayName;
      const overloadIndex = apiItem.overloadIndex - 1;
      const overloadId =
        overloadIndex === 0 ? name : `${name}-${overloadIndex}`;

      // TODO: See if we don't need to create all of the on our own.
      const overLoadHeader = `${apiItem.displayName}(): ${apiItem.returnTypeExcerpt.text}`;
      output.appendNode(
        new DocParagraph({configuration}, [
          new DocHtmlStartTag({
            configuration,
            name: 'h2',
            htmlAttributes: [
              new DocHtmlAttribute({
                configuration,
                name: 'id',
                value: `"${overloadId}"`,
              }),
            ],
          }),
          new DocPlainText({
            configuration,
            text: overLoadHeader,
          }),
          new DocHtmlEndTag({
            configuration,
            name: 'h2',
          }),
        ]),
      );
    }

    if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
      if (apiItem.releaseTag === ReleaseTag.Beta) {
        this._writeBetaWarning(output);
      }
    }

    const decoratorBlocks: DocBlock[] = [];

    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        decoratorBlocks.push(
          ...tsdocComment.customBlocks.filter(block => {
            return (
              block.blockTag.tagNameWithUpperCase ===
              StandardTags.decorator.tagNameWithUpperCase
            );
          }),
        );

        if (tsdocComment.deprecatedBlock) {
          output.appendNode(
            new DocNoteBox({configuration: this._tsdocConfiguration}, [
              new DocParagraph({configuration: this._tsdocConfiguration}, [
                new DocPlainText({
                  configuration,
                  text: 'Warning: This API is now obsolete. ',
                }),
              ]),
              ...tsdocComment.deprecatedBlock.content.nodes,
            ]),
          );
        }

        this._appendSection(output, tsdocComment.summarySection);
      }
    }

    if (apiItem instanceof ApiDeclaredItem && apiItem.excerpt.text.length > 0) {
      let code: string | undefined;
      switch (apiItem.parent?.kind) {
        case ApiItemKind.Class:
          code = `class ${
            apiItem.parent.displayName
          } {${apiItem.getExcerptWithModifiers()}}`;
          break;
        case ApiItemKind.Interface:
          code = `interface ${
            apiItem.parent.displayName
          } {${apiItem.getExcerptWithModifiers()}}`;
          break;
        default:
          code = apiItem.getExcerptWithModifiers();
      }
      if (code) {
        output.appendNode(
          new DocHeading({
            configuration,
            title: 'Signature',
            level: 3,
          }),
        );
        output.appendNode(
          new DocFencedCode({
            configuration,
            code: code,
            language: 'typescript',
          }),
        );
      }

      this._writeHeritageTypes(output, apiItem);
    }

    if (decoratorBlocks.length > 0) {
      output.appendNode(
        new DocHeading({configuration, title: 'Decorators:', level: 4}),
      );
      for (const decoratorBlock of decoratorBlocks) {
        output.appendNodes(decoratorBlock.content.nodes);
      }
    }

    let appendRemarks = true;
    switch (apiItem.kind) {
      case ApiItemKind.Class:
      case ApiItemKind.Interface:
      case ApiItemKind.Namespace:
      case ApiItemKind.Package:
        this._writeRemarksSection(output, apiItem);
        appendRemarks = false;
        break;
    }

    switch (apiItem.kind) {
      case ApiItemKind.Class:
        this._writeClassTables(output, apiItem as ApiClass);
        break;
      case ApiItemKind.Enum:
        this._writeEnumTables(output, apiItem as ApiEnum);
        break;
      case ApiItemKind.Interface:
        this._writeInterfaceTables(output, apiItem as ApiInterface);
        break;
      case ApiItemKind.Constructor:
      case ApiItemKind.ConstructSignature:
      case ApiItemKind.Method:
      case ApiItemKind.MethodSignature:
      case ApiItemKind.Function:
        this._writeParameterTables(output, apiItem as ApiParameterListMixin);
        this._writeThrowsSection(output, apiItem);
        break;
      case ApiItemKind.Namespace:
        this._writePackageOrNamespaceTables(output, apiItem as ApiNamespace);
        break;
      case ApiItemKind.Model:
        this._writeModelTable(output, apiItem as ApiModel);
        break;
      case ApiItemKind.Package:
        this._writePackageOrNamespaceTables(output, apiItem as ApiPackage);
        break;
      case ApiItemKind.Property:
      case ApiItemKind.PropertySignature:
        break;
      case ApiItemKind.TypeAlias:
        break;
      case ApiItemKind.Variable:
        break;
      default:
        throw new Error('Unsupported API item kind: ' + apiItem.kind);
    }

    this._writeDefaultValueSection(output, apiItem);

    if (appendRemarks) {
      this._writeRemarksSection(output, apiItem);
    }

    return output;
  }

  private _writeApiItemPage(apiItem: ApiItem) {
    const output = this._getBaseApiItemPage(apiItem);
    if (ApiParameterListMixin.isBaseClassOf(apiItem)) {
      if (apiItem.overloadIndex > 1) {
        return;
      }

      for (const item of apiItem.getMergedSiblings()) {
        const itemOutput = this._getApiItemPage(item);
        output.appendNodes(itemOutput.nodes);
      }
    } else {
      const itemOutput = this._getApiItemPage(apiItem);
      output.appendNodes(itemOutput.nodes);
    }

    const filename = path.join(
      this._outputFolder,
      this._getFilenameForApiItem(apiItem),
    );
    const stringBuilder = new StringBuilder();
    this._markdownEmitter.emit(stringBuilder, output, {
      contextApiItem: apiItem,
      onGetFilenameForApiItem: (apiItemForFilename: ApiItem) => {
        return this._getLinkFilenameForApiItem(apiItemForFilename);
      },
    });

    let pageContent = stringBuilder.toString();

    if (this._pluginLoader.markdownDocumenterFeature) {
      // Allow the plugin to customize the pageContent
      const eventArgs: IMarkdownDocumenterFeatureOnBeforeWritePageArgs = {
        apiItem: apiItem,
        outputFilename: filename,
        pageContent: pageContent,
      };
      this._pluginLoader.markdownDocumenterFeature.onBeforeWritePage(eventArgs);
      pageContent = eventArgs.pageContent;
    }

    pageContent =
      `---\nsidebar_label: ${this._getSidebarLabelForApiItem(apiItem)}\n---` +
      pageContent;
    pageContent = pageContent.replace('##', '#');
    pageContent = pageContent.replace(/<!-- -->/g, '');
    pageContent = pageContent.replace(/\\\*\\\*/g, '**');
    pageContent = pageContent.replace(/<b>|<\/b>/g, '**');
    FileSystem.writeFile(filename, pageContent, {
      convertLineEndings: this._documenterConfig
        ? this._documenterConfig.newlineKind
        : NewlineKind.CrLf,
    });
  }

  private _writeHeritageTypes(
    output: DocSection,
    apiItem: ApiDeclaredItem,
  ): void {
    const configuration = this._tsdocConfiguration;

    if (apiItem instanceof ApiClass) {
      if (apiItem.extendsType) {
        const extendsParagraph = new DocParagraph({configuration}, [
          new DocEmphasisSpan({configuration, bold: true}, [
            new DocPlainText({configuration, text: 'Extends: '}),
          ]),
        ]);
        this._appendExcerptWithHyperlinks(
          extendsParagraph,
          apiItem.extendsType.excerpt,
        );
        output.appendNode(extendsParagraph);
      }
      if (apiItem.implementsTypes.length > 0) {
        const extendsParagraph = new DocParagraph({configuration}, [
          new DocEmphasisSpan({configuration, bold: true}, [
            new DocPlainText({configuration, text: 'Implements: '}),
          ]),
        ]);
        let needsComma = false;
        for (const implementsType of apiItem.implementsTypes) {
          if (needsComma) {
            extendsParagraph.appendNode(
              new DocPlainText({configuration, text: ', '}),
            );
          }
          this._appendExcerptWithHyperlinks(
            extendsParagraph,
            implementsType.excerpt,
          );
          needsComma = true;
        }
        output.appendNode(extendsParagraph);
      }
    }

    if (apiItem instanceof ApiInterface) {
      if (apiItem.extendsTypes.length > 0) {
        const extendsParagraph = new DocParagraph({configuration}, [
          new DocEmphasisSpan({configuration, bold: true}, [
            new DocPlainText({configuration, text: 'Extends: '}),
          ]),
        ]);
        let needsComma = false;
        for (const extendsType of apiItem.extendsTypes) {
          if (needsComma) {
            extendsParagraph.appendNode(
              new DocPlainText({configuration, text: ', '}),
            );
          }
          this._appendExcerptWithHyperlinks(
            extendsParagraph,
            extendsType.excerpt,
          );
          needsComma = true;
        }
        output.appendNode(extendsParagraph);
      }
    }

    if (apiItem instanceof ApiTypeAlias) {
      const refs: ExcerptToken[] = apiItem.excerptTokens.filter(token => {
        return (
          token.kind === ExcerptTokenKind.Reference &&
          token.canonicalReference &&
          this._apiModel.resolveDeclarationReference(
            token.canonicalReference,
            undefined,
          ).resolvedApiItem
        );
      });
      if (refs.length > 0) {
        const referencesParagraph = new DocParagraph({configuration}, [
          new DocEmphasisSpan({configuration, bold: true}, [
            new DocPlainText({configuration, text: 'References: '}),
          ]),
        ]);
        let needsComma = false;
        const visited = new Set<string>();
        for (const ref of refs) {
          if (visited.has(ref.text)) {
            continue;
          }
          visited.add(ref.text);

          if (needsComma) {
            referencesParagraph.appendNode(
              new DocPlainText({configuration, text: ', '}),
            );
          }

          this._appendExcerptTokenWithHyperlinks(referencesParagraph, ref);
          needsComma = true;
        }
        output.appendNode(referencesParagraph);
      }
    }
  }

  private _writeDefaultValueSection(output: DocSection, apiItem: ApiItem) {
    if (apiItem instanceof ApiDocumentedItem) {
      const block = apiItem.tsdocComment?.customBlocks.find(block => {
        return (
          block.blockTag.tagNameWithUpperCase ===
          StandardTags.defaultValue.tagNameWithUpperCase
        );
      });
      if (block) {
        output.appendNode(
          new DocHeading({
            configuration: this._tsdocConfiguration,
            title: 'Default value:',
            level: 4,
          }),
        );
        this._appendSection(output, block.content);
      }
    }
  }

  private _writeRemarksSection(output: DocSection, apiItem: ApiItem): void {
    const configuration = this._tsdocConfiguration;

    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        // Write the @remarks block
        if (tsdocComment.remarksBlock) {
          output.appendNode(
            new DocHeading({
              configuration,
              title: 'Remarks',
            }),
          );
          this._appendSection(output, tsdocComment.remarksBlock.content);
        }

        // Write the @example blocks
        const exampleBlocks: DocBlock[] = tsdocComment.customBlocks.filter(
          x => {
            return (
              x.blockTag.tagNameWithUpperCase ===
              StandardTags.example.tagNameWithUpperCase
            );
          },
        );

        let exampleNumber = 1;
        for (const exampleBlock of exampleBlocks) {
          const heading: string =
            exampleBlocks.length > 1 ? `Example ${exampleNumber}` : 'Example';

          output.appendNode(
            new DocHeading({
              configuration,
              title: heading,
            }),
          );

          this._appendSection(output, exampleBlock.content);

          ++exampleNumber;
        }
      }
    }
  }

  private _writeThrowsSection(output: DocSection, apiItem: ApiItem): void {
    if (apiItem instanceof ApiDocumentedItem) {
      const tsdocComment: DocComment | undefined = apiItem.tsdocComment;

      if (tsdocComment) {
        // Write the @throws blocks
        const throwsBlocks: DocBlock[] = tsdocComment.customBlocks.filter(x => {
          return (
            x.blockTag.tagNameWithUpperCase ===
            StandardTags.throws.tagNameWithUpperCase
          );
        });

        if (throwsBlocks.length > 0) {
          const heading = 'Exceptions';
          output.appendNode(
            new DocHeading({
              configuration: this._tsdocConfiguration,
              title: heading,
            }),
          );

          for (const throwsBlock of throwsBlocks) {
            this._appendSection(output, throwsBlock.content);
          }
        }
      }
    }
  }

  /**
   * GENERATE PAGE: MODEL
   */
  private _writeModelTable(output: DocSection, apiModel: ApiModel): void {
    const configuration = this._tsdocConfiguration;

    const packagesTable = new DocTable({
      configuration,
      headerTitles: ['Package', 'Description'],
    });

    for (const apiMember of apiModel.members) {
      const row = new DocTableRow({configuration}, [
        this._createTitleCell(apiMember),
        this._createDescriptionCell(apiMember),
      ]);

      switch (apiMember.kind) {
        case ApiItemKind.Package:
          packagesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;
      }
    }

    if (packagesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Packages',
        }),
      );
      output.appendNode(packagesTable);
    }
  }

  /**
   * GENERATE PAGE: PACKAGE or NAMESPACE
   */
  private _writePackageOrNamespaceTables(
    output: DocSection,
    apiContainer: ApiPackage | ApiNamespace,
  ): void {
    const configuration = this._tsdocConfiguration;

    const classesTable = new DocTable({
      configuration,
      headerTitles: ['Class', 'Description'],
    });

    const enumerationsTable = new DocTable({
      configuration,
      headerTitles: ['Enumeration', 'Description'],
    });

    const functionsTable = new DocTable({
      configuration,
      headerTitles: ['Function', 'Description'],
    });

    const interfacesTable = new DocTable({
      configuration,
      headerTitles: ['Interface', 'Description'],
    });

    const namespacesTable = new DocTable({
      configuration,
      headerTitles: ['Namespace', 'Description'],
    });

    const variablesTable = new DocTable({
      configuration,
      headerTitles: ['Variable', 'Description'],
    });

    const typeAliasesTable = new DocTable({
      configuration,
      headerTitles: ['Type Alias', 'Description'],
    });

    const apiMembers: readonly ApiItem[] =
      apiContainer.kind === ApiItemKind.Package
        ? (apiContainer as ApiPackage).entryPoints[0]!.members
        : (apiContainer as ApiNamespace).members;

    for (const apiMember of apiMembers) {
      const row = new DocTableRow({configuration}, [
        this._createTitleCell(apiMember),
        this._createDescriptionCell(apiMember),
      ]);

      switch (apiMember.kind) {
        case ApiItemKind.Class:
          classesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Enum:
          enumerationsTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Interface:
          interfacesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Namespace:
          namespacesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Function:
          functionsTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.TypeAlias:
          typeAliasesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;

        case ApiItemKind.Variable:
          variablesTable.addRow(row);
          this._writeApiItemPage(apiMember);
          break;
      }
    }

    if (classesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Classes',
        }),
      );
      output.appendNode(classesTable);
    }

    if (enumerationsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Enumerations',
        }),
      );
      output.appendNode(enumerationsTable);
    }
    if (functionsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Functions',
        }),
      );
      output.appendNode(functionsTable);
    }

    if (interfacesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Interfaces',
        }),
      );
      output.appendNode(interfacesTable);
    }

    if (namespacesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Namespaces',
        }),
      );
      output.appendNode(namespacesTable);
    }

    if (variablesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Variables',
        }),
      );
      output.appendNode(variablesTable);
    }

    if (typeAliasesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Type Aliases',
        }),
      );
      output.appendNode(typeAliasesTable);
    }
  }

  /**
   * GENERATE PAGE: CLASS
   */
  private _writeClassTables(output: DocSection, apiClass: ApiClass): void {
    const configuration = this._tsdocConfiguration;

    const eventsTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description'],
    });

    const constructorsTable = new DocTable({
      configuration,
      headerTitles: ['Constructor', 'Modifiers', 'Description'],
    });

    const propertiesTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description'],
    });

    const methodsTable = new DocTable({
      configuration,
      headerTitles: ['Method', 'Modifiers', 'Description'],
    });

    for (const apiMember of apiClass.members) {
      switch (apiMember.kind) {
        case ApiItemKind.Constructor: {
          constructorsTable.addRow(
            new DocTableRow({configuration}, [
              this._createTitleCell(apiMember),
              this._createModifiersCell(apiMember),
              this._createDescriptionCell(apiMember),
            ]),
          );

          this._writeApiItemPage(apiMember);
          break;
        }
        case ApiItemKind.Method: {
          methodsTable.addRow(
            new DocTableRow({configuration}, [
              this._createTitleCell(apiMember),
              this._createModifiersCell(apiMember),
              this._createDescriptionCell(apiMember),
            ]),
          );

          this._writeApiItemPage(apiMember);
          break;
        }
        case ApiItemKind.Property: {
          if ((apiMember as ApiPropertyItem).isEventProperty) {
            eventsTable.addRow(
              new DocTableRow({configuration}, [
                this._createTitleCell(apiMember, true),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember),
              ]),
            );
          } else {
            propertiesTable.addRow(
              new DocTableRow({configuration}, [
                this._createTitleCell(apiMember, true),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember),
              ]),
            );
          }
          break;
        }
      }
    }

    if (eventsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Events',
        }),
      );
      output.appendNode(eventsTable);
    }

    if (constructorsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Constructors',
        }),
      );
      output.appendNode(constructorsTable);
    }

    if (propertiesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Properties',
        }),
      );
      output.appendNode(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Methods',
        }),
      );
      output.appendNode(methodsTable);
    }
  }

  /**
   * GENERATE PAGE: ENUM
   */
  private _writeEnumTables(output: DocSection, apiEnum: ApiEnum): void {
    const configuration = this._tsdocConfiguration;

    const enumMembersTable = new DocTable({
      configuration,
      headerTitles: ['Member', 'Value', 'Description'],
    });

    for (const apiEnumMember of apiEnum.members) {
      enumMembersTable.addRow(
        new DocTableRow({configuration}, [
          new DocTableCell({configuration}, [
            new DocParagraph({configuration}, [
              new DocPlainText({
                configuration,
                text: Utilities.getConciseSignature(apiEnumMember),
              }),
            ]),
          ]),
          this._createInitializerCell(apiEnumMember),
          this._createDescriptionCell(apiEnumMember),
        ]),
      );
    }

    if (enumMembersTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Enumeration Members',
        }),
      );
      output.appendNode(enumMembersTable);
    }
  }

  /**
   * GENERATE PAGE: INTERFACE
   */
  private _writeInterfaceTables(
    output: DocSection,
    apiClass: ApiInterface,
  ): void {
    const configuration = this._tsdocConfiguration;

    const eventsTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description'],
    });

    const propertiesTable = new DocTable({
      configuration,
      headerTitles: ['Property', 'Modifiers', 'Type', 'Description', 'Default'],
    });

    const methodsTable = new DocTable({
      configuration,
      headerTitles: ['Method', 'Description'],
    });

    for (const apiMember of apiClass.members) {
      switch (apiMember.kind) {
        case ApiItemKind.ConstructSignature:
        case ApiItemKind.MethodSignature: {
          methodsTable.addRow(
            new DocTableRow({configuration}, [
              this._createTitleCell(apiMember),
              this._createDescriptionCell(apiMember),
            ]),
          );

          this._writeApiItemPage(apiMember);
          break;
        }
        case ApiItemKind.PropertySignature: {
          if ((apiMember as ApiPropertyItem).isEventProperty) {
            eventsTable.addRow(
              new DocTableRow({configuration}, [
                this._createTitleCell(apiMember, true),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember),
              ]),
            );
          } else {
            propertiesTable.addRow(
              new DocTableRow({configuration}, [
                this._createTitleCell(apiMember, true),
                this._createModifiersCell(apiMember),
                this._createPropertyTypeCell(apiMember),
                this._createDescriptionCell(apiMember),
                this._createDefaultCell(apiMember),
              ]),
            );
          }
          break;
        }
      }
    }

    if (eventsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Events',
        }),
      );
      output.appendNode(eventsTable);
    }

    if (propertiesTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Properties',
        }),
      );
      output.appendNode(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Methods',
        }),
      );
      output.appendNode(methodsTable);
    }
  }

  /**
   * GENERATE PAGE: FUNCTION-LIKE
   */
  private _writeParameterTables(
    output: DocSection,
    apiParameterListMixin: ApiParameterListMixin,
  ): void {
    const configuration = this._tsdocConfiguration;

    const parametersTable = new DocTable({
      configuration,
      headerTitles: ['Parameter', 'Type', 'Description'],
    });
    for (const apiParameter of apiParameterListMixin.parameters) {
      const parameterDescription = new DocSection({configuration});

      if (apiParameter.isOptional) {
        parameterDescription.appendNodesInParagraph([
          new DocEmphasisSpan({configuration, italic: true}, [
            new DocPlainText({configuration, text: '(Optional)'}),
          ]),
          new DocPlainText({configuration, text: ' '}),
        ]);
      }

      if (apiParameter.tsdocParamBlock) {
        this._appendAndMergeSection(
          parameterDescription,
          apiParameter.tsdocParamBlock.content,
        );
      }

      parametersTable.addRow(
        new DocTableRow({configuration}, [
          new DocTableCell({configuration}, [
            new DocParagraph({configuration}, [
              new DocPlainText({configuration, text: apiParameter.name}),
            ]),
          ]),
          new DocTableCell({configuration}, [
            this._createParagraphForTypeExcerpt(
              apiParameter.parameterTypeExcerpt,
            ),
          ]),
          new DocTableCell({configuration}, parameterDescription.nodes),
        ]),
      );
    }

    if (parametersTable.rows.length > 0) {
      output.appendNode(
        new DocHeading({
          configuration,
          title: 'Parameters',
        }),
      );
      output.appendNode(parametersTable);
    }

    if (ApiReturnTypeMixin.isBaseClassOf(apiParameterListMixin)) {
      const returnTypeExcerpt: Excerpt =
        apiParameterListMixin.returnTypeExcerpt;
      output.appendNode(
        new DocParagraph({configuration}, [
          new DocEmphasisSpan({configuration, bold: true}, [
            new DocPlainText({configuration, text: 'Returns:'}),
          ]),
        ]),
      );

      output.appendNode(this._createParagraphForTypeExcerpt(returnTypeExcerpt));

      if (apiParameterListMixin instanceof ApiDocumentedItem) {
        if (
          apiParameterListMixin.tsdocComment &&
          apiParameterListMixin.tsdocComment.returnsBlock
        ) {
          this._appendSection(
            output,
            apiParameterListMixin.tsdocComment.returnsBlock.content,
          );
        }
      }
    }
  }

  private _createParagraphForTypeExcerpt(excerpt: Excerpt): DocParagraph {
    const configuration = this._tsdocConfiguration;

    const paragraph = new DocParagraph({configuration});
    if (!excerpt.text.trim()) {
      paragraph.appendNode(
        new DocPlainText({configuration, text: '(not declared)'}),
      );
    } else {
      this._appendExcerptWithHyperlinks(paragraph, excerpt);
    }

    return paragraph;
  }

  private _appendExcerptWithHyperlinks(
    docNodeContainer: DocNodeContainer,
    excerpt: Excerpt,
  ): void {
    for (const token of excerpt.spannedTokens) {
      this._appendExcerptTokenWithHyperlinks(docNodeContainer, token);
    }
  }

  private _appendExcerptTokenWithHyperlinks(
    docNodeContainer: DocNodeContainer,
    token: ExcerptToken,
  ): void {
    const configuration = this._tsdocConfiguration;

    // Markdown doesn't provide a standardized syntax for hyperlinks inside code
    // spans, so we will render the type expression as DocPlainText.  Instead of
    // creating multiple DocParagraphs, we can simply discard any newlines and
    // let the renderer do normal word-wrapping.
    const unwrappedTokenText = token.text.replace(/[\r\n]+/g, ' ');

    // If it's hyperlinkable, then append a DocLinkTag
    if (token.kind === ExcerptTokenKind.Reference && token.canonicalReference) {
      const apiItemResult: IResolveDeclarationReferenceResult =
        this._apiModel.resolveDeclarationReference(
          token.canonicalReference,
          undefined,
        );

      if (apiItemResult.resolvedApiItem) {
        docNodeContainer.appendNode(
          new DocLinkTag({
            configuration,
            tagName: StandardTags.link.tagName,
            linkText: unwrappedTokenText,
            urlDestination: this._getLinkFilenameForApiItem(
              apiItemResult.resolvedApiItem,
            ),
          }),
        );
        return;
      }
    }

    // Otherwise append non-hyperlinked text
    docNodeContainer.appendNode(
      new DocPlainText({configuration, text: unwrappedTokenText}),
    );
  }

  private _createTitleCell(apiItem: ApiItem, plain = false): DocTableCell {
    const configuration = this._tsdocConfiguration;

    const text = Utilities.getConciseSignature(apiItem);

    return new DocTableCell({configuration}, [
      new DocParagraph({configuration}, [
        new DocHtmlStartTag({
          configuration,
          name: 'span',
          htmlAttributes: [
            new DocHtmlAttribute({
              configuration,
              name: 'id',
              value: `"${Utilities.getSafeFilenameForName(apiItem.displayName)}"`,
            }),
          ],
        }),
        plain
          ? new DocPlainText({configuration, text})
          : new DocLinkTag({
              configuration,
              tagName: '@link',
              linkText: text,
              urlDestination: this._getLinkFilenameForApiItem(apiItem),
            }),
        new DocHtmlEndTag({
          configuration,
          name: 'span',
        }),
      ]),
    ]);
  }

  /**
   * This generates a DocTableCell for an ApiItem including the summary section
   * and "(BETA)" annotation.
   *
   * @remarks
   * We mostly assume that the input is an ApiDocumentedItem, but it's easier to
   * perform this as a runtime check than to have each caller perform a type
   * cast.
   */
  private _createDescriptionCell(apiItem: ApiItem): DocTableCell {
    const configuration = this._tsdocConfiguration;

    const section = new DocSection({configuration});

    if (ApiReleaseTagMixin.isBaseClassOf(apiItem)) {
      if (apiItem.releaseTag === ReleaseTag.Beta) {
        section.appendNodesInParagraph([
          new DocEmphasisSpan({configuration, bold: true, italic: true}, [
            new DocPlainText({configuration, text: '(BETA)'}),
          ]),
          new DocPlainText({configuration, text: ' '}),
        ]);
      }
    }

    if (apiItem instanceof ApiDocumentedItem) {
      const isExperimental =
        apiItem.tsdocComment?.modifierTagSet.isExperimental();
      if (isExperimental) {
        section.appendNodesInParagraph([
          new DocEmphasisSpan({configuration, bold: true, italic: true}, [
            new DocPlainText({configuration, text: '(Experimental)'}),
          ]),
          new DocPlainText({configuration, text: ' '}),
        ]);
      }
    }

    if (apiItem instanceof ApiDocumentedItem) {
      if (apiItem.tsdocComment !== undefined) {
        this._appendAndMergeSection(
          section,
          apiItem.tsdocComment.summarySection,
        );

        if (apiItem.tsdocComment.deprecatedBlock) {
          section.appendNode(
            new DocParagraph({configuration}, [
              new DocEmphasisSpan({configuration, bold: true}, [
                new DocPlainText({configuration, text: 'Deprecated: '}),
              ]),
            ]),
          );

          section.appendNodes(
            apiItem.tsdocComment.deprecatedBlock.content.getChildNodes(),
          );
        }
      }
    }

    if (apiItem instanceof ApiDocumentedItem) {
      const remarks = apiItem.tsdocComment?.remarksBlock;
      if (remarks) {
        section.appendNode(
          new DocParagraph({configuration}, [
            new DocEmphasisSpan({configuration, bold: true}, [
              new DocPlainText({configuration, text: 'Remarks: '}),
            ]),
          ]),
        );

        section.appendNodes(remarks.content.getChildNodes());
      }
    }

    return new DocTableCell({configuration}, section.nodes);
  }

  private _createDefaultCell(apiItem: ApiItem): DocTableCell {
    const configuration = this._tsdocConfiguration;

    if (apiItem instanceof ApiDocumentedItem) {
      const block = apiItem.tsdocComment?.customBlocks.find(block => {
        return (
          block.blockTag.tagNameWithUpperCase ===
          StandardTags.defaultValue.tagNameWithUpperCase
        );
      });
      if (block !== undefined) {
        return new DocTableCell({configuration}, block.content.getChildNodes());
      }
    }

    return new DocTableCell({configuration}, []);
  }

  private _createModifiersCell(apiItem: ApiItem): DocTableCell {
    const configuration = this._tsdocConfiguration;

    const section = new DocSection({configuration});

    const codes = [];

    if (ApiProtectedMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isProtected) {
        codes.push('protected');
      }
    }

    if (ApiReadonlyMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isReadonly) {
        codes.push('readonly');
      }
    }

    if (ApiStaticMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isStatic) {
        codes.push('static');
      }
    }

    if (ApiOptionalMixin.isBaseClassOf(apiItem)) {
      if (apiItem.isOptional) {
        codes.push('optional');
      }
    }

    if (apiItem instanceof ApiDocumentedItem) {
      if (apiItem.tsdocComment?.deprecatedBlock) {
        codes.push('deprecated');
      }
    }
    if (codes.length) {
      section.appendNode(
        new DocParagraph({configuration}, [
          new DocCodeSpan({configuration, code: codes.join(', ')}),
        ]),
      );
    }

    return new DocTableCell({configuration}, section.nodes);
  }

  private _createPropertyTypeCell(apiItem: ApiItem): DocTableCell {
    const configuration = this._tsdocConfiguration;

    const section = new DocSection({configuration});

    if (apiItem instanceof ApiPropertyItem) {
      section.appendNode(
        this._createParagraphForTypeExcerpt(apiItem.propertyTypeExcerpt),
      );
    }

    return new DocTableCell({configuration}, section.nodes);
  }

  private _createInitializerCell(apiItem: ApiItem): DocTableCell {
    const configuration = this._tsdocConfiguration;

    const section = new DocSection({configuration});

    if (ApiInitializerMixin.isBaseClassOf(apiItem)) {
      if (apiItem.initializerExcerpt) {
        section.appendNodeInParagraph(
          new DocCodeSpan({
            configuration,
            code: apiItem.initializerExcerpt.text,
          }),
        );
      }
    }

    return new DocTableCell({configuration}, section.nodes);
  }

  private _writeBetaWarning(output: DocSection): void {
    const configuration = this._tsdocConfiguration;
    const betaWarning =
      'This API is provided as a preview for developers and may change' +
      ' based on feedback that we receive.  Do not use this API in a production environment.';
    output.appendNode(
      new DocNoteBox({configuration}, [
        new DocParagraph({configuration}, [
          new DocPlainText({configuration, text: betaWarning}),
        ]),
      ]),
    );
  }

  private _appendSection(output: DocSection, docSection: DocSection): void {
    for (const node of docSection.nodes) {
      output.appendNode(node);
    }
  }

  private _appendAndMergeSection(
    output: DocSection,
    docSection: DocSection,
  ): void {
    let firstNode = true;
    for (const node of docSection.nodes) {
      if (firstNode) {
        if (node.kind === DocNodeKind.Paragraph) {
          output.appendNodesInParagraph(node.getChildNodes());
          firstNode = false;
          continue;
        }
      }
      firstNode = false;

      output.appendNode(node);
    }
  }

  private _getSidebarLabelForApiItem(apiItem: ApiItem): string {
    if (apiItem.kind === ApiItemKind.Package) {
      return 'API';
    }

    let baseName = '';
    for (const hierarchyItem of apiItem.getHierarchy()) {
      // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
      let qualifiedName = hierarchyItem.displayName;
      if (ApiParameterListMixin.isBaseClassOf(hierarchyItem)) {
        if (hierarchyItem.overloadIndex > 1) {
          // Subtract one for compatibility with earlier releases of API Documenter.
          qualifiedName += `_${hierarchyItem.overloadIndex - 1}`;
        }
      }

      switch (hierarchyItem.kind) {
        case ApiItemKind.Model:
        case ApiItemKind.EntryPoint:
        case ApiItemKind.EnumMember:
        case ApiItemKind.Package:
          break;
        default:
          baseName += qualifiedName + '.';
      }
    }
    return baseName.slice(0, baseName.length - 1);
  }

  private _getFilenameForApiItem(apiItem: ApiItem, link = false): string {
    if (apiItem.kind === ApiItemKind.Package) {
      return 'index.md';
    }

    let baseName = '';
    let suffix = '';
    for (const hierarchyItem of apiItem.getHierarchy()) {
      // For overloaded methods, add a suffix such as "MyClass.myMethod_2".
      const qualifiedName = Utilities.getSafeFilenameForName(
        hierarchyItem.displayName,
      );

      switch (hierarchyItem.kind) {
        case ApiItemKind.Model:
        case ApiItemKind.EntryPoint:
        case ApiItemKind.EnumMember:
        // Properties don't have separate pages
        case ApiItemKind.Property:
        case ApiItemKind.PropertySignature:
          break;
        case ApiItemKind.Package:
          baseName = Utilities.getSafeFilenameForName(
            PackageName.getUnscopedName(hierarchyItem.displayName),
          );
          break;
        default:
          baseName += '.' + qualifiedName;
      }

      if (link) {
        switch (hierarchyItem.kind) {
          case ApiItemKind.Property:
          case ApiItemKind.PropertySignature:
            suffix =
              '#' +
              Utilities.getSafeFilenameForName(
                PackageName.getUnscopedName(hierarchyItem.displayName),
              );
            break;
        }
      }
    }

    return `${baseName}.md${suffix}`;
  }

  private _getLinkFilenameForApiItem(apiItem: ApiItem): string {
    return './' + this._getFilenameForApiItem(apiItem, true);
  }

  private _deleteOldOutputFiles(): void {
    console.log('Deleting old output from ' + this._outputFolder);
    FileSystem.ensureEmptyFolder(this._outputFolder);
  }
}
