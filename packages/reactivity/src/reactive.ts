import { isObject } from '@toy-vue/shared'

const reactiveMap = new WeakMap()
enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) return true
  },
  set(target, key, value, recevier) {
    return true
  }
}

export function reactive(target) {
  return createReactiveObject(target)
}

function createReactiveObject(target) {
  if (!isObject(target)) {
    console.warn(`target ${target} must be a object`)
    return target
  }
  // 访问target的这个属性，如果target是代理对象，那就会触发get，如果不是，就会返回undefined
  if (target[ReactiveFlags.IS_REACTIVE]) return target
  // 如果这个对象已经reactive过了，就直接返回
  let existingProxy = reactiveMap.get(target)
  if (existingProxy) return existingProxy

  let proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}
