import { proxyRefs, reactive } from '@toy-vue/reactivity'
import { hasOwn, isFunction, ShapeFlags } from '@toy-vue/shared'

export function createComponentInstance(vnode, parent) {
  const instance = {
    data: null, // 状态
    vnode, // 组件的虚拟节点
    subTree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件的更新函数
    props: {},
    attrs: {},
    slots: {},
    propsOptions: vnode.type.props, // 用户声明的哪些属性是组件的属性
    component: null,
    proxy: null, // 代理props，attrs，data
    setupState: {},
    exposed: null, // 暴露出去的属性,不能是{},在ref时会认为exposed始终有值
    parent,
    provides: parent ? parent.provides : Object.create(null)
  }
  return instance
}
// 初始化属性
const initProps = (instance, rawProps) => {
  const props = {}
  const attrs = {}
  // 用户在组件中的props
  const propsOptions = instance.propsOptions || {}
  // 所有的
  if (rawProps) {
    for (let key in rawProps) {
      const value = rawProps[key]
      if (key in propsOptions) props[key] = value
      else attrs[key] = value
    }
  }
  instance.attrs = attrs
  instance.props = reactive(props)
}

const publiceProerty = {
  $attrs: (instance) => instance.attrs,
  $slots: (instance) => instance.slots
}
const handler = {
  get(target, key) {
    const { data, props, setupState } = target

    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key]
    }
    // 对于一些无法修改的属性 $slots $attrs->instance.attrs
    const getter = publiceProerty[key] // 通过不同的策略来访问对应的方法
    if (getter) return getter(target)
  },
  set(target, key, value) {
    const { data, props, setupState } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      console.warn(`props is readonly`)
      return false
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value
    }
    return true
  }
}

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children
  } else instance.slots = {}
}

export function setupComponent(instance) {
  const { vnode } = instance
  // 初始化属性: 区分props，attrs
  initProps(instance, vnode.props)
  initSlots(instance, vnode.children)
  // 初始化代理对象
  instance.proxy = new Proxy(instance, handler)

  const { data = () => {}, render, setup } = vnode.type
  if (!isFunction(data)) return console.warn('data must be a function')

  if (setup) {
    const setupContext = {
      // ......
      slots: instance.slots,
      attrs: instance.attrs,
      expose(value) {
        instance.exposed = value
      },
      emit(event, ...payload) {
        const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`
        const handler = instance.vnode.props[eventName]
        handler && handler(...payload)
      }
    }
    setCurrentInstance(instance)
    const setupResult = setup(instance.props, setupContext)
    unsetCurrentInstance()
    if (isFunction(setupResult)) {
      instance.render = setupResult
    } else {
      debugger
      instance.setupState = proxyRefs(setupResult) // 将返回的值做脱ref
    }
  }

  // data可以拿到props
  // instance.data = reactive(data.call(instance.proxy))
  instance.data = data.call(instance.proxy)
  if (!instance.render) instance.render = render
}

export let currentInstance = null
export const getCurrentInstance = () => {
  return currentInstance
}
export const setCurrentInstance = (instance) => {
  currentInstance = instance
}
export const unsetCurrentInstance = () => {
  currentInstance = null
}
