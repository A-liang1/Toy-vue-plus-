import { track, trigger } from './reactiveEffect'

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) return true

    track(target, key)

    return Reflect.get(target, key, recevier)
  },
  set(target, key, value, recevier) {
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, recevier)
    if (oldValue !== value) {
      trigger(target, key, value, oldValue)
    }
    return result
  }
}
