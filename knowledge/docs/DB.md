# DB

PocketBase に `knowledge` コレクションを1つ追加する。

| 列 | 型 | 内容 |
|---|---|---|
| id | PocketBase 標準 | 自動採番 |
| category | select（単一） | 営業 / 契約 / 開発思想 / IT知識 / 名言 |
| content | text | 中身（一言） |

- 補足欄やタグは持たない。必要になったら足す。
- created / updated は PocketBase が自動で持つ。
- content は原文そのまま（誤字・話し言葉も直さない）。
- 外部非公開。API ルールはすべて superuser のみ。
