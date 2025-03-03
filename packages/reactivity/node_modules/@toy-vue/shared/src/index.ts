import { reactive } from '@toy-vue/reactivity'

export function isObject(value) {
  return typeof value === 'object' && value !== null
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}
