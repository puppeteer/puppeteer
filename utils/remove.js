var glob = require('glob');
const fs = require('fs');

let files = glob.sync(`./new-docs/*.md`);

files.forEach(function(file){
    let str = file;
    let data = fs.readFileSync(str,'utf-8');
          var newValue = data.replace(/<!-- -->/gim, '');
          fs.writeFileSync(str, newValue, 'utf-8', function(err, data) {
                if (err) throw err;
                  console.log('Done!');
          });
});
