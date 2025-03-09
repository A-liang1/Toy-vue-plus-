import { hasOwn, ShapeFlags } from '@toy-vue/shared'
import { Fragment, isSameVnode, Text } from './createVNode'
import getSequence from './seq'
import { reactive, ReactiveEffect } from '@toy-vue/reactivity'
import queueJob from './scheduler'
import { createComponentInstance, setupComponent } from './component'

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
  // 元素 首次渲染 挂载子节点
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; ++i) {
      // children[i] 可能是数组或字符串
      patch(null, children[i], container)
    }
  }
  // 元素 首次渲染 挂载元素
  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor)
  }

  // 判断元素是否是首次渲染，决定走上边或下边的逻辑
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) mountElement(n2, container, anchor)
    else patchElement(n1, n2, container)
  }

  // 元素 非首次渲染 更新属性
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
      let child = children[i]
      unmount(child)
    }
  }
  // 元素 非首次渲染 全量diff算法 (1)   快速diff(靶向更新)->基于模版编译的 (2)
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
    // 新的比老的多
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], el, anchor)
          ++i
        }
      }
    }
    // 老的比新的多
    else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i])
        ++i
      }
    }
    // 中间对比
    else {
      let s1 = i
      let s2 = i

      const keyToNewIndexMap = new Map() // 做一个映射表用于快速查找，看老的节点在新的节点里边是否存在
      let toBePatched = e2 - s2 + 1 // 倒序插入的个数

      const newIndexToOldIndexMap = new Array(toBePatched).fill(0) // 记录新节点在老节点中的位置

      // 遍历新节点，记录key和index
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i]
        if (vnode.key) keyToNewIndexMap.set(vnode.key, i)
      }
      console.log(keyToNewIndexMap, '老节点在新节点中是否存在')
      // 遍历老节点，查找新节点是否存在，不存在则删除，存在则更新
      for (let i = s1; i <= e1; i++) {
        const vnode = c1[i]
        const newIndex = keyToNewIndexMap.get(vnode.key)
        if (newIndex === undefined) unmount(vnode)
        else {
          // 记录新节点在老节点中的位置，+1 是因为0为空(i可能是0)
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          console.log(newIndex, s2, newIndexToOldIndexMap, '新节点在老节点中的位置-->[1,2]')
          patch(vnode, c2[newIndex], el)
        }
      }

      let increasingSeq = getSequence(newIndexToOldIndexMap)
      let j = increasingSeq.length - 1

      console.log(increasingSeq)
      // 倒序插入
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null
        if (!nextChild.el) patch(null, nextChild, el, anchor)
        else {
          // 移动的元素已经存在el中，所以不需要再创建新的el
          if (i === increasingSeq[j]) j--
          else hostInsert(nextChild.el, el, anchor)
        }
      }
    }
  }
  // 元素 非首次渲染 更新子节点
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
  // 元素 非首次渲染 更新
  const patchElement = (n1, n2, container) => {
    // 比较元素差异、比较属性和元素的子节点
    const el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  // Text文本
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      // 1.虚拟节点要关联真实节点  2.将节点插入到页面中
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    } else {
      const el = (n2.el = n1.el)
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  // Fragment
  const processFragment = (n1, n2, container) => {
    if (n1 === null) mountChildren(n2.children, container)
    else patchChildren(n1, n2, container)
  }

  // 更新组件属性和插槽
  const updateComponentPreRender = (instance, next) => {
    instance.next = null
    instance.vnode = next
    updateProps(instance, instance.props, next.props)
  }
  // 挂载组件的effect
  function setupRenderEffect(instance, container, anchor) {
    const { render } = instance
    const componentUpdateFn = () => {
      // 要在这里区分，是第一次还是之后的
      if (!instance.isMounted) {
        const subTree = render.call(instance.proxy, instance.proxy)
        patch(null, subTree, container, anchor)
        instance.isMounted = true
        instance.subTree = subTree
      } else {
        const { next } = instance
        if (next) {
          //更新属性或插槽
          updateComponentPreRender(instance, next)
        }
        const subTree = render.call(instance.proxy, instance.proxy)
        patch(instance.subTree, subTree, container, anchor)
        instance.subTree = subTree
      }
    }
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(update))
    const update = (instance.update = () => effect.run())
    update()
  }
  // 挂载组件
  const mountComponent = (vnode, container, anchor) => {
    // 1. 创建组件实例
    const instance = (vnode.component = createComponentInstance(vnode))
    // 2. 给实例的属性赋值
    setupComponent(instance)
    // 3. 创建一个effect
    setupRenderEffect(instance, container, anchor)
  }

  // 更新组件工具函数 比较前后props是否有变化
  function hasPropsChange(prevProps, nextProps) {
    const nKeys = Object.keys(nextProps)
    if (nKeys.length !== Object.keys(prevProps).length) return true

    for (let i = 0; i < nKeys.length; ++i) {
      const key = nKeys[i]
      if (nextProps[key] !== prevProps[key]) return true
    }
    return false
  }
  //更新组件props
  const updateProps = (instance, prvVprops, nextProps) => {
    if (hasPropsChange(prvVprops, nextProps)) {
      // 用新的覆盖老的
      for (let key in nextProps) {
        instance.props[key] = nextProps[key]
      }
      // 删除多余老的
      for (let key in instance.props) {
        if (!hasOwn(nextProps, key)) delete instance.props[key]
      }
    }
  }
  // 组件更新时判断是否需要更新
  const shouldComponentUpdate = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1
    const { props: nextProps, children: nextChildren } = n2

    if (prevChildren || nextChildren) return true // 有插槽直接走重新渲染即可
    if (prevProps === nextProps) return false
    // 如果属性不一致实则更新
    return hasPropsChange(prevProps, nextProps)
    // updateProps(instance, prevProps, nextProps)
  }
  // 更新组件
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component)
    // 把对属性和插槽的更新放到组件的effect中
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2
      instance.update()
    }
  }

  // 组件处理
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) mountComponent(n2, container, anchor)
    else updateComponent(n1, n2)
  }

  // patch打补丁，挂载或更新
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return

    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1)
      n1 = null
    }
    const { type, shapeFlag } = n2
    switch (type) {
      // 对Text文本处理
      case Text:
        processText(n1, n2, container)
        break
      // 对Fragment处理
      case Fragment:
        processFragment(n1, n2, container)
        break
      // 对元素处理，挂载或更新
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // 对组件的处理，vue3中函数式组件已经废弃，没有性能节约
          processComponent(n1, n2, container, anchor)
        }
    }
  }
  // render渲染更新
  const render = (vnode, container) => {
    if (vnode == null) {
      if (container._vnode) unmount(container._vnode)
    } else {
      patch(container._vnode || null, vnode, container)
      container._vnode = vnode
    }
  }

  // 移除元素工具方法
  function unmount(vnode) {
    if (vnode.type === Fragment) unmountChildren(vnode.children)
    else hostRemove(vnode.el)
  }

  return {
    render
  }
}
