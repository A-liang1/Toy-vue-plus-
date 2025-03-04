import { isFunction } from '@toy-vue/shared'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'

class ComputedRefImpl {
  public _value
  public effect
  public dep
  constructor(
    getter,
    public setter
  ) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        triggerRefValue(this)
      }
    )
  }

  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run()
      trackRefValue(this)
    }
    return this._value
  }
  set value(v) {
    this.setter(v)
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions)

  let getter
  let setter
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn('computed value must be readonly')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
