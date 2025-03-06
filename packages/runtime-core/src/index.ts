import { ShapeFlags } from '@toy-vue/shared/src'
export function createRenderer(renderOptions) {
  const {
    insert: hostInset,
    remove: hostRemove,
    createElmenet: hostCreateElement,
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
    const { type, children, props, ShapeFlags } = vnode
    let el = hostCreateElement(type)
    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    if (ShapeFlags & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (ShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    hostInset(el, container)
  }

  //渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) {
      return
    }

    if (null === null) {
      mountElement(n2, container)
    }
  }

  const render = (vnode, container) => {
    patch(container._vnode || null, vnode, container)
    container._vnode = vnode
  }

  return {
    render
  }
}
