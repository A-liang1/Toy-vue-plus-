import { reactive } from '@toy-vue/reactivity'

export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function isString(value) {
  return typeof value === 'string'
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}

export * from './shapeFlags'

const hasOwnProperty = Object.prototype.hasOwnProperty

export const hasOwn = (value, key) => hasOwnProperty.call(value, key)
