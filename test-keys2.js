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

console.log("Original result:", enumerableProperties);
console.log("Object.keys(obj):", Object.keys(obj));
