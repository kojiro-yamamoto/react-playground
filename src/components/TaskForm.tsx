import { useState, type FormEvent } from 'react'
import './TaskForm.css'

type TaskFormProps = {
  onAdd: (title: string) => void
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
