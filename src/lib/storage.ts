import type { Task } from '../types'

const STORAGE_KEY = 'react-playground:tasks'

// 保存が一度もないときに表示するサンプル
const sampleTasks: Task[] = [
  { id: 't1', title: '牛乳を買う', done: false },
  { id: 't2', title: 'React のドキュメントを読む', done: true },
  { id: 't3', title: '請求書を送る', done: false },
]

export function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return sampleTasks
    return JSON.parse(saved) as Task[]
  } catch {
    // 保存データが壊れている / localStorage が使えない
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // 容量オーバーなどで保存できなくても、アプリは動かし続ける
  }
}
