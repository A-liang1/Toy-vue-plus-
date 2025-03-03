import { activeEffect, trackEffect, triggerEffects } from './effect'

export const createDep = (cleanup, key) => {
  const dep = new Map() as any
  dep.cleanup = cleanup
  dep.name = key
  return dep
}

const targetMap = new WeakMap()
export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) targetMap.set(target, (depsMap = new Map()))

    let dep = depsMap.get(key)
    if (!dep) depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)))

    trackEffect(activeEffect, dep)
  }
}

export function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  let dep = depsMap.get(key)
  if (dep) {
    triggerEffects(dep)
  }
}
