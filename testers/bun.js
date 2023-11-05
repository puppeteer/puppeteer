scriptids = [1,2,3,4,5,6,7,8,9,10]
let stateids = '';
for (let index = 0; index < scriptids.length; index++) {
    stateids = stateids + `${scriptids[index].stateid},` // '1'
    console.log(scriptids[index].stateid)
} 
stateids = stateids.slice(0,-1);   
console.log('stateids: ',stateids);
 