import { isObject } from '@toy-vue/shared'
import { track, trigger } from './reactiveEffect'
import { reactive, readonly } from './reactive'
import { ReactiveFlags } from './constant'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)
const shallowReactiveGet = createGetter(false, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    else if (key === ReactiveFlags.IS_READONLY) return isReadonly

    const res = Reflect.get(target, key, receiver)
    // 如果是shallow，就不递归处理，只响应式处理第一层
    if (shallow) return res
    // 如果是对象，就递归处理，解决对象嵌套深层问题
    if (isObject(res)) return isReadonly ? readonly(res) : reactive(res)
    // 不是readonly的时候才收集依赖
    if (!isReadonly) track(target, key)

    return res
  }
}

function createSetter() {
  return function set(target, key, value, receiver) {
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue)
    }
    return result
  }
}

export const mutableHandlers: ProxyHandler<any> = {
  get,
  set
}

export const readonlyHandlers: ProxyHandler<any> = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`key: ${String(key)} set failed because target is readonly`, target)
    return true
  }
}

export const shallowReadonlyHandlers: ProxyHandler<any> = {
  get: shallowReadonlyGet,
  set(target, key) {
    console.warn(`key: ${String(key)} set failed because target is readonly`, target)
    return true
  }
}

export const shallowReactiveHandlers: ProxyHandler<any> = {
  get: shallowReactiveGet,
  set
}
