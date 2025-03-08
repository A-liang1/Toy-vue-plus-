const queue = [] // 缓存当前要执行的队列
let isFlushing = false // 是否正在执行
const resolvePromise = Promise.resolve()

export default function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }

  if (!isFlushing) {
    isFlushing = true

    resolvePromise.then(() => {
      isFlushing = false

      const copy = queue.slice(0)
      queue.length = 0
      // debugger
      // 先执行两个age++，然后console.log(age)
      copy.forEach((job) => job())
      copy.length = 0
    })
  }
}
// 通过事件循环机制，延迟更新操作，先走宏任务->微任务
