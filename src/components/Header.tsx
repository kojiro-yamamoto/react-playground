import './Header.css'

type HeaderProps = {
  remaining: number
  total: number
}

export function Header({ remaining, total }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">タスク管理</h1>
      <p className="header__count">
        残り <strong>{remaining}</strong> 件 / 全 {total} 件
      </p>
    </header>
  )
}
