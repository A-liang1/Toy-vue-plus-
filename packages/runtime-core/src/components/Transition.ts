import { getCurrentInstance, h } from '@toy-vue/runtime-dom'

function nextFrame(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn)
  })
}

export function resolveTransitionProps(props) {
  const {
    name = 'v',
    enterFormClass = `${name}-enter-form`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFormClass = `${name}-leave-form`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    onBeforeEnter,
    onEnter,
    onLeave
  } = props

  return {
    onBeforeEnter(el) {
      onBeforeEnter && onBeforeEnter(el)
      el.classList.add(enterFormClass)
      el.classList.add(enterActiveClass)
    },
    onEnter(el, done) {
      const resolve = () => {
        el.classList.remove(enterToClass)
        el.classList.remove(enterActiveClass)
        done && done()
      }

      onEnter && onEnter(el, resolve)

      // 添加后再移除，不是马上移除
      nextFrame(() => {
        el.classList.remove(enterFormClass)
        el.classList.add(enterToClass)

        if (!onEnter || onEnter.length <= 1) {
          el.addEventListener('transitionend', resolve)
        }
      })
    },
    onLeave(el, done) {
      const resolve = () => {
        el.classList.remove(leaveToClass)
        el.classList.remove(leaveActiveClass)
        done && done()
      }
      onEnter && onEnter(el, resolve)

      el.classList.add(leaveFormClass)
      document.body.offsetHeight
      el.classList.add(leaveActiveClass)

      nextFrame(() => {
        el.classList.remove(leaveFormClass)
        el.classList.add(leaveToClass)

        if (!onLeave || onLeave.length <= 1) {
          el.addEventListener('transitionend', resolve)
        }
      })
    }
  }
}

export function Transition(props, { slots }) {
  return h(BaseTransitionImple, resolveTransitionProps(props), slots)
}

const BaseTransitionImple = {
  props: {
    onBeforeEnter: Function,
    onEnter: Function,
    onLeave: Function
  },
  setup(props, { slots }) {
    return () => {
      const vnode = slots.default && slots.default()
      if (!vnode) return
      vnode.transition = {
        beforeEnter: props.onBeforeEnter,
        enter: props.onEnter,
        leave: props.onLeave
      }
      return vnode
    }
  }
}
