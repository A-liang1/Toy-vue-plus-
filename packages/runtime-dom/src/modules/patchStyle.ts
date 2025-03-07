export default function patchStyle(el, prevValue, nextValue) {
  const style = el.style

  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue == null || nextValue[key] == null) {
        style[key] = ''
      }
    }
  }

  if (nextValue) {
    for (let key in nextValue) {
      style[key] = nextValue[key]
    }
  }
}
