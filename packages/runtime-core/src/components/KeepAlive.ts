import { getCurrentInstance } from '../component'
import { onMounted, onUpdated } from '../apiLifecycle'
import { ShapeFlags } from '@toy-vue/shared'

export const KeepAlive = {
  __isKeepAlive: true,
  props: {
    max: Number
  },
  setup(props, { slots }) {
    const { max } = props
    const keys = new Set() // 用来记录key，哪些组件缓存过
    const cache = new Map() // 缓存表

    let pendingCacheKey = null
    const instance = getCurrentInstance()

    const cacheSubTree = () => {
      cache.set(pendingCacheKey, instance.subTree)
    }
    // 这里是keepalive特有的初始化方法
    const { move, createElement, unmount: _unmount } = instance.ctx.renderer

    function reset(vnode) {
      let shapeFlag = vnode.shapeFlag
      if (shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_KEPT_ALIVE
      }
      if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
        shapeFlag -= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      }
      vnode.shapeFlag = shapeFlag
    }
    function unmount(vnode) {
      reset(vnode) // 将vnode标识删除
      _unmount(vnode) // 再真正的作删除
    }
    function purnCacheEntry(key) {
      keys.delete(key)
      const cached = cache.get(key)
      unmount(cached)
      cache.delete(key) // 需要删除缓存
    }

    // 激活时执行
    instance.ctx.activate = function (vnode, container, anchor) {
      move(vnode, container, anchor)
    }
    // 卸载的时候执行
    const storageContent = createElement('div')
    instance.ctx.deactivate = function (vnode) {
      move(vnode, storageContent, null)
    }

    onMounted(cacheSubTree)
    onUpdated(cacheSubTree)

    return () => {
      const vnode = slots.default()

      const comp = vnode.type
      const key = vnode.key == null ? comp : vnode.key

      const cacheVNode = cache.get(key)
      pendingCacheKey = key
      if (cacheVNode) {
        vnode.component = cacheVNode.component
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE

        keys.delete(key)
        keys.add(key)
      } else {
        keys.add(key)
        if (max && keys.size > max) {
          // 达到了最大缓存个数
          // set中的第一个元素
          purnCacheEntry(keys.values().next().value)
        }
      }

      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      return vnode
    }
  }
}

export const isKeepAlive = (value) => value.type.__isKeepAlive
