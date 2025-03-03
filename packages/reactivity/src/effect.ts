export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler 调度函数
    _effect.run()
  })
  _effect.run()
}

export let activeEffect
class ReactiveEffect {
  _trackId = 0
  deps = []
  _depsLength = 0

  active = true
  constructor(
    public fn,
    public scheduler
  ) {}
  run() {
    if (!this.active) return this.fn()

    let lastEffect = activeEffect
    try {
      activeEffect = this
      return this.fn()
    } finally {
      activeEffect = lastEffect
    }
  }
}

export function trackEffect(effect, dep) {
  // depsMap就是对象的键对应值，值是一个dep
  // dep是哪个effect的，一个键的dep可能有很多effect，这样之后触发依赖直接遍历这个键对应的dep;
  dep.set(effect, effect._trackId++)
  // 每一个effect都有一个deps属性，存放所有dep
  effect.deps[effect._depsLength++] = dep
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) effect.scheduler()
    else effect.run()
  }
}
