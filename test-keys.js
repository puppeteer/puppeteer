const obj = Object.create({ a: 1 });
obj.b = 2;
Object.defineProperty(obj, 'c', { value: 3, enumerable: false });
const sym = Symbol('sym');
obj[sym] = 4;

const descriptors = Object.getOwnPropertyDescriptors(obj);
const enumerableProperties = [];
for (const propertyName in descriptors) {
  if (descriptors[propertyName]?.enumerable) {
    enumerableProperties.push(propertyName);
  }
}
console.log("Original:", enumerableProperties);
console.log("Object.keys:", Object.keys(obj));

// Test with arrays
const arr = [1, 2, 3];
const descriptors2 = Object.getOwnPropertyDescriptors(arr);
const enum2 = [];
for (const p in descriptors2) {
  if (descriptors2[p]?.enumerable) enum2.push(p);
}
console.log("Arr Original:", enum2);
console.log("Arr Object.keys:", Object.keys(arr));
