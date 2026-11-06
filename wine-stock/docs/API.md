# API

## 共通
- 入口は1本: `python wine.py <cmd> '<json>'`
- 出力は常にJSON。`{"ok": true, ...}` または `{"ok": false, "missing": [...], "error": "..."}`
- 必須項目が欠けたら `missing` を返す。Claude はそれを会話で埋めて再実行する。
- 登録系は、実行前に Claude が内容を見せてユーザーのOKをとる。

## コマンド（5つ）

| cmd | 用途 | 必須 | 任意 |
|---|---|---|---|
| `stock` | 在庫数 | - | `wine`（省略で全件） |
| `buys` | 仕入履歴 | `wine` | `from`, `to` |
| `sales` | 販売実績 | - | `from`, `to`, `wine`, `client` |
| `buy` | 仕入登録 | `wine`, `qty`, `cost`, `date` | `supplier` |
| `sell` | 販売登録 | `wine`, `qty`, `price`, `client`, `date` | - |

## wine の解決
- `wine` は id か、名前の一部（空白区切りで全語を含むもの）。
- 照会（stock / buys / sales）は、当てはまるもの全部が対象になる。
- 登録（buy / sell）は1件に決まったときだけ処理する。複数件なら `candidates` を返し、Claude が聞き返す。
- `sales` は銘柄ごとの本数・金額と、`total`（合計）を返す。合計もスクリプトが出す。

## 新しいワイン
- `buy` で `wine` がマスタにないときは、`producer`, `name`, `vintage`, `color` を `missing` として返す。
- それが埋まったら、ワインを登録してから仕入を記録する。

## ルール
- `sell` で在庫がマイナスになるなら拒否する。
- `qty` は正の整数のみ。
