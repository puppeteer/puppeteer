#!/usr/bin/env node

const Browser = require('../../lib/Browser');
const path = require('path');
const fs = require('fs');
const lint = require('./lint');
const markdownToc = require('markdown-toc');

const PROJECT_DIR = path.join(__dirname, '..', '..');
const DOCS_DIR = path.join(PROJECT_DIR, 'docs');
const SOURCES_DIR = path.join(PROJECT_DIR, 'lib');

const RED_COLOR = '\x1b[31m';
const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

const startTime = Date.now();
const browser = new Browser({args: ['--no-sandbox']});
browser.newPage().then(async page => {
  const errors = await lint(page, DOCS_DIR, SOURCES_DIR);
  await browser.close();
  if (errors.length) {
    console.log('Documentation Failures:');
    for (let i = 0; i < errors.length; ++i) {
      let error = errors[i];
      error = error.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${RED_COLOR}${error}${RESET_COLOR}`);
    }
  }
  const warnings = regenerateTOC(DOCS_DIR);
  if (warnings.length) {
    console.log('Documentation Warnings:');
    for (let i = 0; i < warnings.length; ++i) {
      let warning = warnings[i];
      warning = warning.split('\n').join('\n      ');
      console.log(`  ${i + 1}) ${YELLOW_COLOR}${warning}${RESET_COLOR}`);
    }
  }
  console.log(`${errors.length} failures, ${warnings.length} warnings.`);
  const runningTime = Date.now() - startTime;
  console.log(`Finished in ${runningTime / 1000} seconds`);
  process.exit(errors.length + warnings.length > 0 ? 1 : 0);
});

/**
 * @param {string} dirPath
 * @return {!Array<string>}
 */
function regenerateTOC(dirPath) {
  let filePaths = fs.readdirSync(dirPath)
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => path.join(dirPath, fileName));
  let messages = [];
  for (let filePath of filePaths) {
    const markdownText = fs.readFileSync(filePath, 'utf8');
    const newMarkdownText = markdownToc.insert(markdownText);
    if (markdownText === newMarkdownText)
      continue;
    fs.writeFileSync(filePath, newMarkdownText, 'utf8');
    messages.push('Regenerated table-of-contexts: ' + path.relative(PROJECT_DIR, filePath));
  }
  return messages;
}
