// アプリ全体で共有する型だけをここに置く

export type Task = {
  id: string
  title: string
  done: boolean
}

export type Filter = 'all' | 'active' | 'done'
