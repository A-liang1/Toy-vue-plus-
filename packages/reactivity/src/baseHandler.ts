export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers: ProxyHandler<any> = {
  get(target, key, recevier) {
    if (key === ReactiveFlags.IS_REACTIVE) return true
    return Reflect.get(target, key, recevier)
  },
  set(target, key, value, recevier) {
    return Reflect.set(target, key, value, recevier)
  }
}
