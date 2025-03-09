import { reactive } from '@toy-vue/reactivity'
import { hasOwn, isFunction } from '@toy-vue/shared'
import { render } from '../../runtime-dom/src/index'

export function createComponentInstance(vnode) {
  const instance = {
    data: null, // 状态
    vnode, // 组件的虚拟节点
    subTree: null, // 子树
    isMounted: false, // 是否挂载完成
    update: null, // 组件的更新函数
    props: {},
    attrs: {},
    propsOptions: vnode.type.props, // 用户声明的哪些属性是组件的属性
    component: null,
    proxy: null // 代理props，attrs，data
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
  $attrs: (instance) => instance.attrs
}
const handler = {
  get(target, key) {
    const { data, props } = target

    if (data && hasOwn(data, key)) {
      return data[key]
    } else if (props && hasOwn(props, key)) {
      return props[key]
    }
    // 对于一些无法修改的属性 $slots $attrs->instance.attrs
    const getter = publiceProerty[key] // 通过不同的策略来访问对应的方法
    if (getter) return getter(target)
  },
  set(target, key, value) {
    const { data, props } = target
    if (data && hasOwn(data, key)) {
      data[key] = value
    } else if (props && hasOwn(props, key)) {
      console.warn(`props is readonly`)
      return false
    }
    return true
  }
}

export function setupComponent(instance) {
  const { vnode } = instance
  // 初始化属性: 区分props，attrs
  initProps(instance, vnode.props)
  // 初始化代理对象
  instance.proxy = new Proxy(instance, handler)

  const { data, render } = vnode.type
  if (!isFunction(data)) return console.warn('data must be a function')

  // data可以拿到props
  instance.data = reactive(data.call(instance.proxy))

  instance.render = render
}
