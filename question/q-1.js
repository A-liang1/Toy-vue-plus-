// Proxy 、 Reflect （ES6）
// Proxy接收两个参数，一个原始对象，一个处理对象，处理对象有get，set，has，deleteProperty等，返回一个代理对象...
// Reflect有get，set，has，deleteProperty等。get返回原始对象的属性，有第三个参数就会改变返回属性的this指向;set返回一个boolean值，四个参数同get;
const person = {
  name: 'al',
  get aName() {
    return this.name + '123'
  }
}

let proxyPerson = new Proxy(person, {
  // proxy代理过后的得到的对象，当读取这个对象的属性时会拦截触发get操作。
  // target是代理的对象，key是读取的属性名，receiver是proxy代理后的对象
  get(target, key, receiver) {
    console.log(key)
    // Reflect是一个内置的对象，它提供了很多操作对象的方法，
    // 访问原始对象的target的key属性，然后将this绑定到receiver上，这样就不会访问代理对象的属性而导致触发get操作。
    return Reflect.get(target, key, receiver)
  }
})

console.log(proxyPerson.aName)
