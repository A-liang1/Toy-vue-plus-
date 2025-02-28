import { isObject } from '@toy-vue/shared'
import { ReactiveFlags, mutableHandlers } from './baseHandler'

const reactiveMap = new WeakMap()

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
