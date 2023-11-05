const userAgents = require('../config/userAgents')
maxlength = userAgents.length
console.log(maxlength)
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
  }
randomindex = randomIntFromInterval(1,100)
console.log(randomindex)
userAgent= userAgents[randomindex];
console.log(userAgent)