// reactive的标识，用于判断是否是reactive对象
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}

// 计算属性computed脏值，脏就计算，不脏就返回缓存值
export enum DirtyLevels {
  Dirty = 4,
  NoDirty = 0
}
