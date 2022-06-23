#!/usr/bin/env node

(async () => {
  const {createReadStream} = require('fs');
  const {join} = require('path');
  const {createInterface} = require('readline');

  const lines = [];
  let isRecording = false;

  for await (const line of createInterface({
    input: createReadStream(join(__dirname, '../CHANGELOG.md'), {
      encoding: 'utf-8',
    }),
  })) {
    if (line.startsWith('## ')) {
      if (!isRecording) {
        isRecording = true;
        continue;
      } else {
        break;
      }
    }
    if (isRecording) {
      lines.push(line);
    }
  }

  if (lines.length === 0) {
    throw new Error('Latest changelog should be non-empty.');
  }

  console.log(lines.join('\n').trim());
})();
