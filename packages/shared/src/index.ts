import { reactive } from '@toy-vue/reactivity'

export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}

export * from './shapeFlags'
