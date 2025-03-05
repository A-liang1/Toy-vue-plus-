// 节点元素的 属性操作 class style event

import patchAttr from './modules/patchAttr'
import patchClass from './modules/patchClass'
import patchEvent from './modules/patchEvent'
import patchStyle from './modules/patchStyle'

export default function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') return patchClass(el, nextValue)
  else if (key === 'style') return patchStyle(el, prevValue, nextValue)
  else if (/^on[^a-z]/.test(key)) return patchEvent(el, key, nextValue)
  else return patchAttr(el, key, nextValue)
}
