import { useState, type SubmitEvent } from 'react'
import './App.css'

// ---------------------------------------------
// 型定義
// ---------------------------------------------
type Task = {
  id: string
  title: string
  done: boolean
}

// 最初に表示しておくタスク（Step 3 で localStorage に置き換える）
const initialTasks: Task[] = [
  { id: 't1', title: '牛乳を買う', done: false },
  { id: 't2', title: 'React のドキュメントを読む', done: true },
  { id: 't3', title: '請求書を送る', done: false },
]

// ---------------------------------------------
// TaskItem：タスク1件。押されたら親に id を報告する
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
// TaskList：受け取った配列を並べるだけ。親から来た関数はそのまま子へ渡す
// ---------------------------------------------
type TaskListProps = {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty">タスクはまだありません</p>
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
// TaskForm：入力中の文字は自分で持つ。確定したら親に渡す
// ---------------------------------------------
type TaskFormProps = {
  onAdd: (title: string) => void
}

function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() // ページのリロードを止める

    const trimmed = title.trim()
    if (trimmed === '') return // 空文字は追加しない

    onAdd(trimmed)
    setTitle('') // 入力欄を空に戻す
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
// App：tasks の持ち主。更新処理をすべてここに集める
// ---------------------------------------------
function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  // state ではなく、tasks から毎回計算する（派生した値）
  const remaining = tasks.filter((task) => !task.done).length

  function handleAdd(title: string) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      done: false,
    }
    setTasks((prev) => [...prev, newTask]) // 元の配列を壊さず、新しい配列を作る
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

      <TaskList tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  )
}

export default App
