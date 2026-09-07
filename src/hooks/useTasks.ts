import { useEffect, useState } from 'react'
import { loadTasks, saveTasks } from '../lib/storage'
import type { Task } from '../types'

/**
 * タスクの state と、その更新処理・永続化をまとめたフック。
 * 「タスクをどう保持するか」を知っているのはこのファイルだけ。
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  function addTask(title: string) {
    const newTask: Task = { id: crypto.randomUUID(), title, done: false }
    setTasks((prev) => [...prev, newTask])
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    )
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  return { tasks, addTask, toggleTask, deleteTask }
}
