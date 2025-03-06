import { nodeOps } from './nodeOps'
import patchProp from './patchProp'
import { createRenderer } from '@toy-vue/runtime-core'

const renderOptions = Object.assign({ patchProp }, nodeOps)

export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container)
}

export * from '@toy-vue/runtime-core'
// createRenderer(renderOptions).render()
