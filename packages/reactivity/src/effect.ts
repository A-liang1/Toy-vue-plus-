export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, () => {
    // scheduler 调度函数
    _effect.run()
  })
  _effect.run()
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect)
  if (dep.size === 0) dep.cleanup()
}

// [a,b,c] -[a] 清理b，c这样末尾的依赖项
function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++)
      cleanDepEffect(effect.deps[i], effect)
    effect.deps.length = effect._depsLength
  }
}

export let activeEffect
function preCleanEffect(effect) {
  effect._depsLength = 0
  effect._trackId++
}
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
      // 每次run的时候，清空deps
      preCleanEffect(this)
      return this.fn()
    } finally {
      postCleanEffect(this)
      activeEffect = lastEffect
    }
  }
}

export function trackEffect(effect, dep) {
  // 一个简易的diff算法对比effect前后的依赖进行更新
  // 防止依赖重复添加
  if (dep.get(effect) !== effect._trackId) {
    // depsMap就是对象的键对应值，值是一个dep
    // dep是哪个effect的，一个键的dep可能有很多effect，这样之后触发依赖直接遍历这个键对应的dep;
    dep.set(effect, effect._trackId)

    let oldDep = effect.deps[effect._depsLength]
    if (oldDep !== dep) {
      if (oldDep) cleanDepEffect(oldDep, effect)
      // 每一个effect都有一个deps属性，存放所有dep
      effect.deps[effect._depsLength++] = dep
    } else effect._depsLength++
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    if (effect.scheduler) effect.scheduler()
    else effect.run()
  }
}
