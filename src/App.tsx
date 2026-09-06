import './App.css'

// ---------------------------------------------
// 型定義：このアプリで扱う「タスク」の形
// ---------------------------------------------
type Task = {
  id: string
  title: string
  done: boolean
}

// ---------------------------------------------
// 仮データ：Step 2 で「追加できる状態」に置き換える
// ---------------------------------------------
const tasks: Task[] = [
  { id: 't1', title: '牛乳を買う', done: false },
  { id: 't2', title: 'React のドキュメントを読む', done: true },
  { id: 't3', title: '請求書を送る', done: false },
]

// ---------------------------------------------
// TaskItem：タスク1件分の見た目
// ---------------------------------------------
type TaskItemProps = {
  task: Task
}

function TaskItem({ task }: TaskItemProps) {
  return (
    <li className={task.done ? 'task task--done' : 'task'}>
      <input
        type="checkbox"
        className="task__checkbox"
        checked={task.done}
        readOnly // Step 2 で onChange を付けて外す
      />
      <span className="task__title">{task.title}</span>
      <button
        type="button"
        className="task__delete"
        aria-label={`「${task.title}」を削除`}
      >
        ×
      </button>
    </li>
  )
}

// ---------------------------------------------
// TaskList：タスクの配列を受け取って一覧にする
// ---------------------------------------------
type TaskListProps = {
  tasks: Task[]
}

function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="empty">タスクはまだありません</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}

// ---------------------------------------------
// App：全体の組み立て
// ---------------------------------------------
function App() {
  const remaining = tasks.filter((task) => !task.done).length

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">タスク管理</h1>
        <p className="header__count">
          残り <strong>{remaining}</strong> 件 / 全 {tasks.length} 件
        </p>
      </header>

      {/* Step 2 で実際に追加できるようにする */}
      <form className="form">
        <input
          type="text"
          className="form__input"
          placeholder="やることを入力…"
        />
        <button type="submit" className="form__button">
          追加
        </button>
      </form>

      <TaskList tasks={tasks} />
    </div>
  )
}

export default App
