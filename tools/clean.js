#!/usr/bin/env node

const {exec} = require('child_process');
const {readdirSync} = require('fs');

exec(
  `git clean -Xf ${readdirSync(process.cwd())
    .filter(file => {
      return file !== 'node_modules';
    })
    .join(' ')}`
);
