// reactive (Proxy)  shallowReactive
// ref  (RefImpl类)  shallowRef
import { toReactive } from '@toy-vue/shared'
import { activeEffect, trackEffect, triggerEffects } from './effect'
import { createDep } from './reactiveEffect'

export function ref(value) {
  return createRef(value)
}

function createRef(value) {
  return new RefImpl(value)
}

class RefImpl {
  public __v_isRef = true
  public _value
  public dep
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }
  get value() {
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue
      this._value = newValue
      triggerRefValue(this)
    }
  }
}

function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(activeEffect, (ref.dep = createDep(() => (ref.dep = undefined), 'undefined')))
  }
}

function triggerRefValue(ref) {
  let dep = ref.dep
  if (dep) triggerEffects(dep)
}
