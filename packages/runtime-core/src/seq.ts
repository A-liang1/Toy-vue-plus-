export default function getSequence(arr) {
  const result = [0]
  const len = arr.length
  let start, end, middle
  const p = new Array(len)

  for (let i = 0; i < len; ++i) {
    const currentValue = arr[i]
    // 为了vue3而处理掉数组中 0 的情况 [5,3,4,0]
    if (currentValue === 0) continue
    // 如果当前元素大于result最后一个元素，则将当前元素添加到result中
    const resultLastIndex = result[result.length - 1]
    if (arr[resultLastIndex] < currentValue) {
      p[i] = resultLastIndex
      result.push(i)
      continue
    }
    // 二分查找,找到第一个大于currentValue的位置
    start = 0
    end = result.length - 1
    while (start < end) {
      middle = Math.floor((start + end) / 2)
      if (arr[result[middle]] < currentValue) start = middle + 1
      else end = middle
    }
    // 更新前驱节点和result
    if (currentValue < arr[result[start]]) {
      p[i] = result[start - 1]
      result[start] = i
    }
  }
  // p 为前驱节点的列表，需要根据最后一个节点做追溯
  let l = result.length
  let last = result[l - 1]

  while (l-- > 0) {
    result[l] = last
    last = p[last]
  }

  return result
}
