# Step 3: 絞り込みと永続化

> 「すべて / 未完了 / 完了」の絞り込みと、リロードしてもタスクが消えない保存を実装する回。
> **React の外の世界（ブラウザのストレージ）とどう付き合うか**が本題。
>
> 対象コード: `src/App.tsx`

---

## 3-1. 何が増えたか

| 追加 | 内容 |
|---|---|
| `filter` state | `'all'` / `'active'` / `'done'` のどれか。**state はこれ1つだけ**追加 |
| `visibleTasks` | `tasks` と `filter` から**毎回計算**する派生した値 |
| `FilterBar` | 絞り込みボタン3つ |
| `useEffect` | `tasks` が変わるたび localStorage へ保存 |
| 遅延初期化 | 起動時に localStorage から読み込む |

---

## 3-2. 絞り込みは state を1つ足すだけ

### ユニオン型で「取りうる値」を宣言する

```ts
type Filter = 'all' | 'active' | 'done'
```

`|` で候補を並べた **ユニオン型**。`string` にしてしまうと `'activ'` のようなタイポが通ってしまうが、
これなら**候補以外を代入した時点で赤線**が出るし、エディタが 3つの候補を補完してくれる。

### 絞り込んだ配列は state にしない

ここが Step 3 の一番大事なところ。素直に考えるとこう書きたくなる。

```tsx
// ✗ やってはいけない
const [tasks, setTasks] = useState<Task[]>(...)
const [visibleTasks, setVisibleTasks] = useState<Task[]>(...)   // 絞り込み結果も state
```

しかしこれをやると、**tasks を変える処理すべてで visibleTasks も更新**しなければならない。
追加・トグル・削除・絞り込み切り替え、そのどこか1つを書き忘れた瞬間、
「タスクを追加したのに一覧に出てこない」「削除したのに残っている」という状態になる。
2つの state が持つ情報が**食い違う**からだ。

正解は Step 2-8 と同じ。**計算できるものは計算する。**

```tsx
const visibleTasks = tasks.filter((task) => {
  if (filter === 'active') return !task.done
  if (filter === 'done') return task.done
  return true
})
```

`tasks` か `filter` のどちらかが変われば再レンダリングが起き、この行がもう一度実行される。
**同期を取る努力が一切要らない。**ズレようがない。

> **state に置くのは「他から計算できない情報」だけ。**
> ここでは `tasks`（真実のデータ）と `filter`（ユーザーの選択）の 2つがそれにあたる。
> `visibleTasks` も `remaining` も、その 2つから導ける。

この判断基準は React 設計で最も再利用が効く。迷ったら
**「これは他の state から計算できないか？」**と問う。

### set 関数はそのまま props として渡せる

```tsx
<FilterBar current={filter} onChange={setFilter} />
```

`onChange={(f) => setFilter(f)}` と書く必要はない。`setFilter` は
`(filter: Filter) => void` という関数なので、そのまま渡せば済む。

### `Record<Filter, string>` の効用

```ts
const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'タスクはまだありません',
  active: '未完了のタスクはありません',
  done: '完了したタスクはありません',
}
```

`Record<K, V>` は「キーが K、値が V のオブジェクト」を表す TypeScript の型。
`Filter` に第4の値を足したとき、**このオブジェクトに追記し忘れるとエラーになる**。
分岐の書き漏らしをコンパイル時に防げる。

---

## 3-3. `useEffect` — React の外の世界とつなぐ

```tsx
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}, [tasks])
//  ↑実行したい処理                                    ↑依存配列
```

### 副作用（effect）とは

React のコンポーネントの本来の仕事は **「state から JSX を作って返す」だけ**。
それ以外の、外の世界に影響を与える処理を **副作用**と呼ぶ。

- localStorage への保存
- サーバーへの通信（fetch）
- `document.title` の変更
- `setInterval` などのタイマー

### なぜレンダリング中に書いてはいけないのか

```tsx
function App() {
  const [tasks, setTasks] = useState(loadTasks)
  localStorage.setItem(...)   // ✗ レンダリング中に副作用を書いてはいけない
  return <div>…</div>
}
```

コンポーネント関数は React の都合で**いつ・何回実行されるか分からない**。
`StrictMode` では意図的に2回実行されるし（Step 0-7）、
将来的にはレンダリングを途中で中断・破棄する仕組みも入る。
そんな関数の中で外部に書き込むと、副作用が何回起きるか制御できない。

**`useEffect` は「レンダリングが画面に反映されたあとで、この処理を実行して」と React に予約する仕組み。**
これで実行タイミングが保証される。

### 依存配列がすべてを決める

第2引数の配列が「いつ再実行するか」を決める。ここを間違えるのが `useEffect` の事故の大半。

```tsx
useEffect(() => { ... })            // ① 毎回のレンダリング後に実行
useEffect(() => { ... }, [])        // ② 最初の1回だけ
useEffect(() => { ... }, [tasks])   // ③ tasks が変わったときだけ ← 今回はこれ
```

| 書き方 | 実行タイミング | 主な用途 |
|---|---|---|
| 配列なし | 毎レンダリング後 | ほぼ使わない。無限ループの温床 |
| `[]` | マウント時の1回だけ | 初期データの取得など |
| `[a, b]` | `a` か `b` が変わったとき | **これが基本** |

React は依存配列の中身を **`Object.is` で前回と比較**する（state の比較と同じ仕組み）。
だから Step 2 のイミュータブル更新がここでも効いてくる。
`tasks.push()` で中身だけ変えていたら参照が同じままなので、**この保存処理は動かない**。

### 無限ループのパターン

初心者が必ず1回はやる形。

```tsx
useEffect(() => {
  setTasks([...tasks])      // ✗ state を更新 → 再レンダリング → effect 実行 → …
})
```

依存配列を書き忘れたうえで中で state を更新すると、永久に止まらない。
**「effect の中で更新する state を、依存配列に入れていないか」**を疑うと原因が見つかる。

---

## 3-4. 遅延初期化 — `useState(loadTasks)`

```tsx
const [tasks, setTasks] = useState<Task[]>(loadTasks)   // ○ 関数を「渡す」
```

`loadTasks` の後ろに `()` **が付いていない**のが重要。

```tsx
useState<Task[]>(loadTasks())   // △ 動くが、毎レンダリング localStorage を読む
useState<Task[]>(loadTasks)     // ○ 初回レンダリングでだけ実行される
```

`useState` の初期値は**初回レンダリングでしか使われない**。
にもかかわらず `loadTasks()` と書くと、**再レンダリングのたびにこの関数は実行される**
（結果が捨てられるだけ）。`localStorage` の読み込みと `JSON.parse` が毎回走るのは無駄。

**関数そのものを渡すと、React は初回だけそれを呼ぶ。** これを **遅延初期化**という。
重い初期値の計算では必ずこの形にする。

> `useState(0)` や `useState('')` のような軽い値なら気にしなくてよい。

---

## 3-5. localStorage の扱い

```tsx
const STORAGE_KEY = 'react-playground:tasks'

function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null) return sampleTasks
    return JSON.parse(saved) as Task[]
  } catch {
    return []
  }
}
```

`localStorage` はブラウザにデータを保存する仕組み。
タブを閉じてもデータは残り、**同じブラウザの同じサイト**でのみ読める。

### 文字列しか保存できない

配列やオブジェクトはそのまま入らないので、JSON 文字列に変換して出し入れする。

```
保存: Task[] ──JSON.stringify──▶ '[{"id":"t1",…}]' ──▶ localStorage
読込: localStorage ──▶ '[{"id":"t1",…}]' ──JSON.parse──▶ Task[]
```

### `try / catch` が要る理由

このコードで一番「実務っぽい」部分。次のどれかが起きると例外が飛ぶ。

- 保存データが壊れている（手で編集した、古いバージョンの形式が残っている）→ `JSON.parse` が失敗
- ブラウザのプライバシー設定で `localStorage` 自体が使えない → アクセスで例外
- 容量オーバー（上限は概ね 5MB）→ `setItem` が失敗

囲っておかないと、**アプリが真っ白になって何も表示されなくなる**。
保存が失敗しても最悪データが消えるだけなので、握りつぶして空配列で続行している。

### `as Task[]` は「型の嘘」をつける

```tsx
return JSON.parse(saved) as Task[]
```

`JSON.parse` の戻り値は `any` なので、`as Task[]` で「これは Task の配列です」と
**開発者が宣言している**。ここは注意が必要。

> **型チェックはビルド時にしか働かない。実行時には何のチェックもされない。**

つまり localStorage の中身が実際は別の形でも、TypeScript は気づけない。
実務ではここに **Zod** のようなライブラリを入れて、実行時に形を検証する。
学習アプリなので今は `try/catch` によるフォールバックで妥協している。

---

## 3-6. `useEffect` を使わないほうがいい場面

`useEffect` は強力だが、**初心者が最も乱用する API** でもある。
公式ドキュメントにも「You Might Not Need an Effect」という章があるほど。

| やりたいこと | 正しい方法 |
|---|---|
| 他の state から値を計算したい | **effect は不要。**レンダリング中に計算する（`visibleTasks`） |
| ボタンが押されたときに何かする | **effect は不要。**イベントハンドラに書く |
| state が変わったら別の state を更新したい | だいたい設計ミス。派生した値にできないか疑う |
| 外の世界と同期したい（保存・通信・購読） | **これが `useEffect` の出番** |

判断基準は **「そのコードは、ユーザーの操作で走るのか、画面の表示に同期して走るのか」**。
前者はイベントハンドラ、後者が `useEffect`。

### クリーンアップ関数

今回は使っていないが、`useEffect` は**後片付けの関数を返せる**。

```tsx
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 1000)
  return () => clearInterval(id)   // ← 次の実行前 / 画面から消えるときに呼ばれる
}, [])
```

タイマー・イベントリスナー・WebSocket など「開始したら止める必要があるもの」で必須。
これを書かないとメモリリークになる。

### 開発中に2回保存されるのは正常

`StrictMode`（Step 0-7）では、effect が意図的に **実行 → 片付け → 再実行**される。
クリーンアップの書き忘れを炙り出すための仕組みで、本番ビルドでは1回。
`console.log` が2回出ても壊れていない。

---

## 3-7. 今のコードの状態

アプリとしては完成した。リロードしてもタスクは残り、絞り込みも効く。
残っているのは**コードの構造の問題**だけ。

| 問題 | 内容 |
|---|---|
| `App.tsx` が 200行超 | 型・定数・5つのコンポーネント・ロジックが1ファイルに同居 |
| `App` の責務が多い | 「保存」「絞り込み」「更新処理」「画面の組み立て」を全部やっている |
| 再利用しにくい | 他の画面で `TaskItem` を使いたくても import できない |

これを整理するのが Step 4。**動くものを整理する**という順番自体も、
実際の開発でよく取る進め方（先に構造を作り込みすぎない）。

---

## 3-8. まとめ

- 絞り込みで増やした state は **`filter` ひとつだけ**。絞り込み結果は毎回計算する
- **state に置くのは「他から計算できない情報」だけ。**それ以外は派生した値にする
  - 2つの state が同じ情報を持つと、必ずどこかで食い違う
- **`useEffect`** は「レンダリングが画面に反映されたあと」に副作用を実行する予約
  - 副作用 ＝ 保存・通信・タイマーなど、React の外に影響する処理
  - レンダリング中に書くと、実行回数が制御できない
- **依存配列**が実行タイミングを決める。`[tasks]` で「tasks が変わったときだけ」
  - 比較は `Object.is`。イミュータブル更新をしていないと発火しない
- **`useState(loadTasks)`** の遅延初期化。`loadTasks()` と書くと毎回実行されてしまう
- `localStorage` は**文字列だけ**。`JSON.stringify` / `JSON.parse` で変換し、`try/catch` で守る
- **`as` による型注釈は実行時には効かない。**外から来たデータを信用しすぎない
- `useEffect` は最後の手段。**計算で済むなら計算、操作で済むならイベントハンドラ**

| 用語 | 意味 |
|---|---|
| **副作用（effect）** | レンダリング以外の、外の世界に影響する処理 |
| **依存配列** | `useEffect` の第2引数。何が変わったら再実行するかの指定 |
| **クリーンアップ関数** | effect が返す後片付けの関数。次の実行前と画面から消えるときに走る |
| **遅延初期化** | `useState(fn)` と関数を渡し、初回だけ初期値を計算させること |
| **ユニオン型** | `'a' \| 'b'` のように、取りうる値を並べた型 |
| **型アサーション** | `as Task[]`。開発者が型を断言する記法。実行時チェックはない |

---

← 前は [Step 2: 状態を持たせて動かす](./02-state.md)
→ 次は **Step 4: 整理する**（ファイル分割、カスタムフック、コンポーネント設計）
