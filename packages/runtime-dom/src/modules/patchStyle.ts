export default function patchStyle(el, prevValue, nextValue) {
  const style = el.style

  for (let key in nextValue) {
    style[key] = nextValue[key]
  }

  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] == null) {
        style[key] = null
      }
    }
  }
}
