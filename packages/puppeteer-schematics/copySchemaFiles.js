const fs = require('fs/promises');
const path = require('path');
/**
 *
 * @param {String} directory
 * @param {String[]} files
 */
async function findSchemaFiles(directory, files = []) {
  const items = await fs.readdir(directory);
  const promises = [];
  // Match any listing that has no *.* format
  // Ignore files folder
  const regEx = /^.*\.[^\s]*$/;

  items.forEach(item => {
    if (!item.match(regEx)) {
      promises.push(findSchemaFiles(`${directory}/${item}`, files));
    } else if (item.endsWith('.json') || directory.includes('files')) {
      files.push(`${directory}/${item}`);
    }
  });

  await Promise.all(promises);

  return files;
}

async function copySchemaFiles() {
  const srcDir = './src';
  const outputDir = './lib';
  const files = await findSchemaFiles(srcDir);

  const moves = files.map(file => {
    const to = file.replace(srcDir, outputDir);

    return {from: file, to};
  });

  let promises = [];

  moves.forEach(({to}) => {
    const dir = path.dirname(to);
    promises.push(fs.mkdir(dir, {recursive: true}));
  });

  await Promise.all(promises);

  promises = [];

  moves.forEach(({from, to}) => {
    promises.push(fs.copyFile(from, to));
  });

  await Promise.all(promises);
}

copySchemaFiles();
