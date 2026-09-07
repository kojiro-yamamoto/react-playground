import type { Task } from '../types'
import './TaskItem.css'

type TaskItemProps = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
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
