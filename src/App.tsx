import { useState } from 'react'
import { FilterBar } from './components/FilterBar'
import { Header } from './components/Header'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { useTasks } from './hooks/useTasks'
import type { Filter } from './types'
import './App.css'

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'タスクはまだありません',
  active: '未完了のタスクはありません',
  done: '完了したタスクはありません',
}

export function App() {
  // タスクの保持・更新・保存はすべて useTasks の中
  const { tasks, addTask, toggleTask, deleteTask } = useTasks()

  // 絞り込みは画面の都合なので、ここで持つ
  const [filter, setFilter] = useState<Filter>('all')

  // 派生した値：state にせず毎回計算する
  const remaining = tasks.filter((task) => !task.done).length

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.done
    if (filter === 'done') return task.done
    return true
  })

  return (
    <div className="app">
      <Header remaining={remaining} total={tasks.length} />

      <TaskForm onAdd={addTask} />

      <FilterBar current={filter} onChange={setFilter} />

      <TaskList
        tasks={visibleTasks}
        emptyMessage={EMPTY_MESSAGES[filter]}
        onToggle={toggleTask}
        onDelete={deleteTask}
      />
    </div>
  )
}
