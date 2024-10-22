#! /usr/bin/env -S node --test-reporter spec

/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * `@puppeteer/doctest` tests `@example` code within a JavaScript file.
 *
 * There are a few reasonable assumptions for this tool to work:
 *
 * 1. Examples are written in block comments, not line comments.
 * 2. Examples do not use packages that are not available to the file it exists
 *    in. (Note the package will always be available).
 * 3. Examples are strictly written between code fences (\`\`\`) on separate
 *    lines. For example, \`\`\`console.log(1)\`\`\` is not allowed.
 * 4. Code is written using ES modules.
 *
 * By default, code blocks are interpreted as JavaScript. Use \`\`\`ts to change
 * the language. In general, the format is "\`\`\`[language] [ignore] [fail]".
 *
 * If there are several code blocks within an example, they are concatenated.
 */
import 'source-map-support/register.js';

import assert from 'node:assert';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {basename, dirname, join, relative, resolve} from 'node:path';
import {test} from 'node:test';
import {pathToFileURL} from 'node:url';

import {transform, type Output} from '@swc/core';
import {parse as parseJs} from 'acorn';
import {parse, type Tag} from 'doctrine';
import {Glob} from 'glob';
import {packageDirectory} from 'pkg-dir';
import {
  SourceMapConsumer,
  SourceMapGenerator,
  type RawSourceMap,
} from 'source-map';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

// This is 1-indexed.
interface Position {
  line: number;
  column: number;
}

interface Comment {
  file: string;
  text: string;
  position: Position;
}

interface ExtractedSourceLocation {
  // File path to the original source code.
  origin: string;
  // Mappings from the extracted code to the original code.
  positions: Array<{
    // The 1-indexed line number for the extracted code.
    extracted: number;
    // The position in the original code.
    original: Position;
  }>;
}

interface ExampleCode extends ExtractedSourceLocation {
  language: Language;
  code: string;
  fail: boolean;
}

const enum Language {
  JavaScript,
  TypeScript,
}

const CODE_FENCE = '```';
const BLOCK_COMMENT_START = ' * ';

const {files = []} = await yargs(hideBin(process.argv))
  .scriptName('@puppeteer/doctest')
  .command('* <files..>', `JSDoc @example code tester.`)
  .positional('files', {
    describe: 'Files to test',
    type: 'string',
  })
  .array('files')
  .version(false)
  .help()
  .parse();

for await (const file of new Glob(files, {})) {
  void test(file, async context => {
    const testDirectory = await createTestDirectory(file);
    context.after(async () => {
      if (!process.env['KEEP_TESTS']) {
        await rm(testDirectory, {force: true, recursive: true});
      }
    });
    const tests = [];
    for (const example of await extractJSDocComments(file).then(
      extractExampleCode
    )) {
      tests.push(
        context.test(
          `${file}:${example.positions[0]!.original.line}:${
            example.positions[0]!.original.column
          }`,
          async () => {
            await run(testDirectory, example);
          }
        )
      );
    }
    await Promise.all(tests);
  });
}

async function createTestDirectory(file: string) {
  const dir = await packageDirectory({cwd: dirname(file)});
  if (!dir) {
    throw new Error(`Could not find package root for ${file}.`);
  }

  return await mkdtemp(join(dir, 'doctest-'));
}

async function run(tempdir: string, example: Readonly<ExampleCode>) {
  const path = getTestPath(tempdir, example.code);
  await compile(example.language, example.code, path, example);
  try {
    await import(pathToFileURL(path).toString());
    if (example.fail) {
      throw new Error(`Expected failure.`);
    }
  } catch (error) {
    if (!example.fail) {
      throw error;
    }
  }
}

function getTestPath(dir: string, code: string) {
  return join(
    dir,
    `doctest-${createHash('md5').update(code).digest('hex')}.js`
  );
}

async function compile(
  language: Language,
  sourceCode: string,
  filePath: string,
  location: ExtractedSourceLocation
) {
  const output = await compileCode(language, sourceCode);
  const map = await getExtractSourceMap(output.map, filePath, location);
  await writeFile(filePath, inlineSourceMap(output.code, map));
}

function inlineSourceMap(code: string, sourceMap: RawSourceMap) {
  return `${code}\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    JSON.stringify(sourceMap)
  ).toString('base64')}`;
}

async function getExtractSourceMap(
  map: string,
  generatedFile: string,
  location: ExtractedSourceLocation
) {
  const sourceMap = JSON.parse(map) as RawSourceMap;
  sourceMap.file = basename(generatedFile);
  sourceMap.sourceRoot = '';
  sourceMap.sources = [
    relative(dirname(generatedFile), resolve(location.origin)),
  ];
  const consumer = await new SourceMapConsumer(sourceMap);
  const generator = new SourceMapGenerator({
    file: consumer.file,
    sourceRoot: consumer.sourceRoot,
  });
  // We want descending order of the `generated` property.
  const positions = [...location.positions].reverse();
  consumer.eachMapping(mapping => {
    // Note `mapping.originalLine` is the line number with respect to the
    // extracted, raw code.
    const {extracted, original} = positions.find(({extracted}) => {
      return mapping.originalLine >= extracted;
    })!;

    // `original.line` will account for `extracted`, so we need to subtract
    // `extracted` to avoid duplicity. We also subtract 1 because `extracted` is
    // 1-indexed.
    mapping.originalLine -= extracted - 1;

    generator.addMapping({
      ...mapping,
      original: {
        line: mapping.originalLine + original.line - 1,
        column: mapping.originalColumn + original.column - 1,
      },
      generated: {
        line: mapping.generatedLine,
        column: mapping.generatedColumn,
      },
    });
  });
  return generator.toJSON();
}

const LANGUAGE_TO_SYNTAX = {
  [Language.TypeScript]: 'typescript',
  [Language.JavaScript]: 'ecmascript',
} as const;

async function compileCode(language: Language, code: string) {
  return (await transform(code, {
    sourceMaps: true,
    inlineSourcesContent: false,
    jsc: {
      parser: {
        syntax: LANGUAGE_TO_SYNTAX[language],
      },
      target: 'es2022',
    },
  })) as Required<Output>;
}

const enum Option {
  Ignore = 'ignore',
  Fail = 'fail',
}

function* extractExampleCode(
  comments: Iterable<Readonly<Comment>>
): Iterable<Readonly<ExampleCode>> {
  interface Context {
    language: Language;
    fail: boolean;
    start: number;
  }
  for (const {file, text, position: loc} of comments) {
    const {tags} = parse(text, {
      unwrap: true,
      tags: ['example'],
      lineNumbers: true,
      preserveWhitespace: true,
    });
    for (const {description, lineNumber} of tags as Array<
      Tag & {lineNumber: number}
    >) {
      if (!description) {
        continue;
      }
      const lines = description.split('\n');
      const blocks: ExampleCode[] = [];
      let context: Context | undefined;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const borderIndex = line.indexOf(CODE_FENCE);
        if (borderIndex === -1) {
          continue;
        }
        if (context) {
          blocks.push({
            language: context.language,
            code: lines.slice(context.start, i).join('\n'),
            origin: file,
            positions: [
              {
                extracted: 1,
                original: {
                  line: loc.line + lineNumber + context.start,
                  column:
                    loc.column + borderIndex + BLOCK_COMMENT_START.length + 1,
                },
              },
            ],
            fail: context.fail,
          });
          context = undefined;
          continue;
        }
        const [tag, ...options] = line
          .slice(borderIndex + CODE_FENCE.length)
          .split(' ');
        if (options.includes(Option.Ignore)) {
          // Ignore the code sample.
          continue;
        }
        const fail = options.includes(Option.Fail);
        // Code starts on the next line.
        const start = i + 1;
        if (!tag || tag.match(/js|javascript/)) {
          context = {language: Language.JavaScript, fail, start};
        } else if (tag.match(/ts|typescript/)) {
          context = {language: Language.TypeScript, fail, start};
        }
      }
      // Merging the blocks into a single block.
      yield blocks.reduce(
        (context, {language, code, positions: [position], fail}, index) => {
          assert(position);
          return {
            origin: file,
            language: language || context.language,
            code: `${context.code}\n${code}`,
            positions: [
              ...context.positions,
              {
                ...position,
                extracted:
                  context.code.split('\n').length +
                  context.positions.at(-1)!.extracted -
                  // We subtract this because of the accumulated '\n'.
                  (index - 1),
              },
            ],
            fail: fail || context.fail,
          };
        }
      );
    }
  }
}

async function extractJSDocComments(file: string) {
  const contents = await readFile(file, 'utf8');
  const comments: Comment[] = [];
  parseJs(contents, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    sourceFile: file,
    onComment(isBlock, text, _, __, loc) {
      if (isBlock) {
        comments.push({file, text, position: loc!});
      }
    },
  });
  return comments;
}
