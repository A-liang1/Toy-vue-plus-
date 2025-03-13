import { ShapeFlags } from '@toy-vue/shared'

// 保持逻辑位置与物理渲染位置的解耦
export const Teleport = {
  __isTeleport: true,
  remove(vnode, unmountChildren) {
    const { shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }
  },
  process(n1, n2, container, anchor, parentComponent, internals) {
    let { mountChildren, patchChildren, move } = internals

    if (!n1) {
      const target = (n2.target = document.querySelector(n2.props.to))
      if (target) {
        mountChildren(n2.children, target)
      }
    } else {
      patchChildren(n1, n2, n2.target, parentComponent)
      if (n1.props.to !== n2.props.to) {
        const nextTarget = (n2.target = document.querySelector(n2.props.to))
        n2.children.forEach((child) => {
          move(child, nextTarget, anchor)
        })
      }
    }
  }
}

export const isTeleport = (value) => {
  return value.__isTeleport
}
