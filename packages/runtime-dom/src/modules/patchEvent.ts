function createInvoker(nextValue) {
  const invoker = (e) => invoker.value()
  invoker.value = nextValue
  return invoker
}

export default function patchEvent(el, name, nextValue) {
  const invokers = el.vei || (el.vei = {})
  const eventName = name.slice(2).toLowerCase()
  const exisitingInvokers = invokers[name]

  if (nextValue && exisitingInvokers) {
    return (exisitingInvokers.value = nextValue)
  }

  if (nextValue) {
    const invoker = (invokers[name] = createInvoker(nextValue))
    return el.addEventListener(eventName, invoker)
  }

  if (exisitingInvokers) {
    el.removeEventListener(eventName, exisitingInvokers)
    invokers[name] = undefined
  }
}
