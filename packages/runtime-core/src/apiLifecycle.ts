import { currentInstance, setCurrentInstance, unsetCurrentInstance } from '.'

export const enum LifeCycle {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u'
}

function createHook(type: LifeCycle) {
  // 闭包，将生命周期和实例绑定 *****
  return (hook, target = currentInstance) => {
    // 组件实例要和生命周期绑定
    if (target) {
      const hooks = target[type] || (target[type] = [])
      //让currentInstance存到这个函数内部，这样就不会因为执行顺序导致instance被清空
      const wrapHook = () => {
        setCurrentInstance(target)
        hook.call(target)
        unsetCurrentInstance()
      }

      hooks.push(wrapHook) // 有坑，setup执行完后instance会清空
    }
  }
}

export const onBeforeMount = createHook(LifeCycle.BEFORE_MOUNT)
export const onMounted = createHook(LifeCycle.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycle.BEFORE_UPDATE)
export const onUpdated = createHook(LifeCycle.UPDATED)

export function invokeArray(fns) {
  for (let i = 0; i < fns.length; i++) {
    fns[i]()
  }
}
