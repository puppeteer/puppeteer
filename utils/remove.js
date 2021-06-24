const glob = require('glob');
const fs = require('fs');
const files = glob.sync(`./new-docs/*.md`);
 files.forEach(function(file){
  const str = file;
  const data = fs.readFileSync(str,'utf-8');
  const newValue = data.replace(/<!-- -->/gim, '');
  fs.writeFileSync(str, newValue, 'utf-8', function(err, data) {
    if (err) throw err;
    console.log('Done!');
  });
});
