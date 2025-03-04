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

export function isRef(r) {
  return !!(r && r.__v_isRef === true)
}

export function unref(r) {
  return isRef(r) ? r.value : r
}

export function toValue(source) {
  if (typeof source === 'function') return source()
  else return unref(source)
}

class ObjectRefImpl {
  public __v_isRef = true
  // _object直接存储了源对象的引用，而不是复制源对象（深拷贝）
  // 这样做的好处是，当源对象发生变化时，ObjectRefImpl的value属性也会自动更新
  constructor(
    public _object,
    public _key
  ) {}

  get value() {
    return this._object[this._key]
  }
  set value(newValue) {
    this._object[this._key] = newValue
  }
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
  const res = {}
  for (const key in object) res[key] = toRef(object, key)
  return res
}

export function proxyRefs(objectWithRef) {
  return new Proxy(objectWithRef, {
    get(target, key, receiver) {
      return unref(Reflect.get(target, key, receiver))
    },
    set(target, key, value, receiver) {
      let oldValue = target[key]
      if (oldValue.__v_isRef) {
        oldValue.value = value
        return true
      }
      return Reflect.set(target, key, value, receiver)
    }
  })
}
