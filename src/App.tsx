import { useEffect, useState, type SubmitEvent } from 'react'
import './App.css'

// ---------------------------------------------
// 型定義
// ---------------------------------------------
type Task = {
  id: string
  title: string
  done: boolean
}

// 取りうる値を並べた型（ユニオン型）
type Filter = 'all' | 'active' | 'done'

// ---------------------------------------------
// localStorage との入出力
// ---------------------------------------------
const STORAGE_KEY = 'react-playground:tasks'

// 初回だけ表示するサンプル
const sampleTasks: Task[] = [
  { id: 't1', title: '牛乳を買う', done: false },
  { id: 't2', title: 'React のドキュメントを読む', done: true },
  { id: 't3', title: '請求書を送る', done: false },
]

function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return sampleTasks // 保存が一度もなければサンプルを出す
    return JSON.parse(saved) as Task[]
  } catch {
    // 保存データが壊れている / localStorage が使えない場合
    return []
  }
}

// ---------------------------------------------
// 絞り込みの定義
// ---------------------------------------------
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'done', label: '完了' },
]

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'タスクはまだありません',
  active: '未完了のタスクはありません',
  done: '完了したタスクはありません',
}

type FilterBarProps = {
  current: Filter
  onChange: (filter: Filter) => void
}

function FilterBar({ current, onChange }: FilterBarProps) {
  return (
    <div className="filters" role="group" aria-label="タスクの絞り込み">
      {FILTERS.map((filter) => {
        const isActive = filter.value === current
        return (
          <button
            key={filter.value}
            type="button"
            className={
              isActive ? 'filters__button filters__button--active' : 'filters__button'
            }
            aria-pressed={isActive}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------
// TaskItem
// ---------------------------------------------
type TaskItemProps = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <li className={task.done ? 'task task--done' : 'task'}>
      <input
        type="checkbox"
        className="task__checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
      />
      <span className="task__title">{task.title}</span>
      <button
        type="button"
        className="task__delete"
        onClick={() => onDelete(task.id)}
        aria-label={`「${task.title}」を削除`}
      >
        ×
      </button>
    </li>
  )
}

// ---------------------------------------------
// TaskList
// ---------------------------------------------
type TaskListProps = {
  tasks: Task[]
  emptyMessage: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function TaskList({ tasks, emptyMessage, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty">{emptyMessage}</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

// ---------------------------------------------
// TaskForm
// ---------------------------------------------
type TaskFormProps = {
  onAdd: (title: string) => void
}

function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = title.trim()
    if (trimmed === '') return

    onAdd(trimmed)
    setTitle('')
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="form__input"
        placeholder="やることを入力…"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="submit" className="form__button">
        追加
      </button>
    </form>
  )
}

// ---------------------------------------------
// App
// ---------------------------------------------
function App() {
  // loadTasks を「呼ばずに渡す」＝ 初回レンダリングでだけ実行される（遅延初期化）
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [filter, setFilter] = useState<Filter>('all')

  // tasks が変わるたびに localStorage へ保存する
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // ---- 派生した値：state にせず、毎回計算する ----
  const remaining = tasks.filter((task) => !task.done).length

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.done
    if (filter === 'done') return task.done
    return true
  })

  // ---- 更新処理 ----
  function handleAdd(title: string) {
    const newTask: Task = { id: crypto.randomUUID(), title, done: false }
    setTasks((prev) => [...prev, newTask])
  }

  function handleToggle(id: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    )
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">タスク管理</h1>
        <p className="header__count">
          残り <strong>{remaining}</strong> 件 / 全 {tasks.length} 件
        </p>
      </header>

      <TaskForm onAdd={handleAdd} />

      <FilterBar current={filter} onChange={setFilter} />

      <TaskList
        tasks={visibleTasks}
        emptyMessage={EMPTY_MESSAGES[filter]}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default App
