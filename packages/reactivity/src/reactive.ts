import { isObject } from '@toy-vue/shared'
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers
} from './baseHandler'
import { ReactiveFlags } from './constant'

const reactiveMap = new WeakMap()

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers)
}

export function shallowReactive(target) {
  return createReactiveObject(target, shallowReactiveHandlers)
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers)
}

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyHandlers)
}

export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

export function isReadonly(value) {
  return !!(value && value[ReactiveFlags.IS_READONLY])
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}

function createReactiveObject(target: any, baseHandlers: ProxyHandler<any>) {
  if (!isObject(target)) {
    console.warn(`target ${target} must be a object`)
    return target
  }
  // 访问target的这个属性，如果target是代理对象，那就会触发get，如果不是，就会返回undefined
  if (target[ReactiveFlags.IS_REACTIVE] || target[ReactiveFlags.IS_READONLY]) return target
  // 如果这个对象已经reactive/readonly过了，就直接返回
  let existingProxy = reactiveMap.get(target)
  if (existingProxy) return existingProxy

  const proxy = new Proxy(target, baseHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}
