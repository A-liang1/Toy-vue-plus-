import { ShapeFlags } from '@toy-vue/shared'
import { isSameVnode } from './createVNode'

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp
  } = renderOptions

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; ++i) {
      // children[i] 可能是数组或字符串
      patch(null, children[i], container)
    }
  }

  const mountElement = (vnode, container) => {
    const { type, children, props, shapeFlag } = vnode
    // 第一次渲染的时候让虚拟节点和真实的dom 创建关联 vnode.el = 真实dom
    // 第二次渲染新的vnode，可以和上一次次的vnode作比对，之后更新对应的el元素，可以后续再复用这个dom元素
    let el = (vnode.el = hostCreateElement(type))
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    hostInsert(el, container)
  }

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      patchElement(n1, n2, container)
    }
  }

  const patchProps = (oldProps, newProps, el) => {
    for (let key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }

    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }
  const patchChildren = (n1, n2, el) => {}
  const patchElement = (n1, n2, container) => {
    // 比较元素差异、比较属性和元素的子节点
    const el = (n2.e1 = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  //渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) return

    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    processElement(n1, n2, container) // 对元素处理
  }

  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) unmount(container._vnode)
    }
    patch(container._vnode || null, vnode, container)
    container._vnode = vnode
  }

  const unmount = (vnode) => {
    hostRemove(vnode.el)
  }

  return {
    render
  }
}
