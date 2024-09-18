import fs from 'fs';

let file = fs.readFileSync('./out/main.js', 'utf-8');

file = file.replaceAll('__proto__:[]', '')
file = file.replaceAll('__proto__:null', '')
file = file.replaceAll('d2.__proto__=b2;', '')
file = file.replaceAll('__proto__:[]', '')

fs.writeFileSync('./out/main.js', file)