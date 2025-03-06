import { isObject } from '@toy-vue/shared'
import { createVNode } from './createVNode'

export function h(type, propsOrChildren?, children?) {
  const l = arguments.length
  if (l === 2) {
    // h(h1,虚拟节点|属性)
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 虚拟节点
      if (isVnode(propsOrChildren)) {
        // h('div',h('a'))
        return createVNode(type, null, [propsOrChildren])
      } else {
        //属性
        return createVNode(type, propsOrChildren)
      }
    }
    // 儿子 是 数组 | 文本
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2)
    }

    if (l === 3 && isVnode(children)) {
      children = [children]
    }

    return createVNode(type, propsOrChildren, children)
  }
}

function isVnode(value) {
  return value?.__v_isVnode
}
