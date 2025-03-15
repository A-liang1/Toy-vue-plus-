function leftBound(nums, target) {
  let left = 0,
    right = nums.length - 1
  while (left <= right) {
    const mid = left + ((right - left) >> 1)
    if (nums[mid] >= target) {
      right = mid - 1 // 向左压缩
      console.log(right, left)
    } else {
      left = mid + 1
    }
  }
  // 检查 left 是否有效
  return left < nums.length && nums[left] === target ? left : -1
}

console.log(leftBound([1, 1, 2, 2, 2, 3], 2))
