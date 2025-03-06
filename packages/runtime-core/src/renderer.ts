import { ShapeFlags } from '@toy-vue/shared'

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
    let el = hostCreateElement(type)
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

  //渲染走这里，更新也走这里
  const patch = (n1, n2, container) => {
    if (n1 === n2) {
      return
    }

    if (n1 === null) {
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
