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
  // 首次渲染 挂载子节点
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; ++i) {
      // children[i] 可能是数组或字符串
      patch(null, children[i], container)
    }
  }
  // 首次渲染 挂载元素
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

  //  判断元素是否是首次渲染，决定走上边或下边的逻辑
  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      mountElement(n2, container)
    } else {
      patchElement(n1, n2, container)
    }
  }

  // 非首次渲染 更新属性
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
  // 删除子节点工具函数
  function unmountChildren(children) {
    for (let i = 0; i < children.length; ++i) {
      let chilren = children[i]
      unmount(chilren)
    }
  }
  // 非首次渲染 全量diff算法
  const patchKeyedChildren = (c1, c2, el) => {
    // 比较两个儿子的差异 更新el真实dom
    //双端对比
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 左端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else break
      ++i
    }
    // 右端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else break
      --e1
      --e2
    }
  }
  // 非首次渲染 更新子节点
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (c2 == null) {
      if (c1 != null) {
        unmountChildren(c1)
      }
      return
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 1. 新的是文本，老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      // 2. 新的是文本，老的是文本，内容不相同替换
      if (c1 !== c2) hostSetElementText(el, c2)
    } else {
      // 3. 新的是数组，老的是数组，全量diff算法
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff
          patchKeyedChildren(c1, c2, el)
        } else {
          // 4. 老的是数组，新的是空，直接移除老的子节点
          unmountChildren(c1)
        }
      } else {
        // 5. 老的是文本，新的是空
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        // 6. 新的是数组，老的是文本
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }
  // 非首次渲染 更新
  const patchElement = (n1, n2, container) => {
    // 比较元素差异、比较属性和元素的子节点
    const el = (n2.e1 = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  // patch打补丁，挂载或更新
  const patch = (n1, n2, container) => {
    if (n1 === n2) return
    // ??? 存疑
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    processElement(n1, n2, container) // 对元素处理，挂载或更新
  }
  // render渲染更新
  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) unmount(container._vnode)
    }
    patch(container._vnode || null, vnode, container)
    container._vnode = vnode
  }

  // 移除元素工具方法
  function unmount(vnode) {
    hostRemove(vnode.el)
  }

  return {
    render
  }
}
