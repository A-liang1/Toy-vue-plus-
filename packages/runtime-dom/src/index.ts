export * from '@toy-vue/reactivity'
import { nodeOps } from './nodeOps'
import patchProp from './patchProp'

const renderOptions = Object.assign({ patchProp }, nodeOps)

export default renderOptions
// createRenderer(renderOptions).render()
