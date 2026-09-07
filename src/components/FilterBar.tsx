import type { Filter } from '../types'
import './FilterBar.css'

// このバー自身のデータなので、ここに置いておく
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'done', label: '完了' },
]

type FilterBarProps = {
  current: Filter
  onChange: (filter: Filter) => void
}

export function FilterBar({ current, onChange }: FilterBarProps) {
  return (
    <div className="filters" role="group" aria-label="タスクの絞り込み">
      {FILTERS.map((filter) => {
        const isActive = filter.value === current
        return (
          <button
            key={filter.value}
            type="button"
            className={
              isActive
                ? 'filters__button filters__button--active'
                : 'filters__button'
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
