# API

## 接続

- PocketBase: `http://127.0.0.1:8090`（サーバー内からのみ使う）
- `knowledge` のルールはすべて superuser のみ。外部からは読めない。
- Claude Code 専用の superuser を作り、認証情報は `/root/common/.env`（Git 管理外）に置く。
  - `PB_EMAIL` / `PB_PASSWORD`

## 操作

`knowledge/kb.py` を経由する（標準ライブラリのみ）。

| コマンド | 内容 |
|---|---|
| `kb.py list [カテゴリー]` | 全件（またはカテゴリー指定）を JSON で出す |
| `kb.py add <カテゴリー> <中身>` | 1件追加 |
| `kb.py add-many` | 標準入力の JSON 配列 `[{"category","content"}]` をまとめて追加 |
| `kb.py update <id> [--category X] [--content Y]` | 修正 |
| `kb.py delete <id>` | 削除 |

検索は全件を取得して Claude が意味で選ぶ。件数が少ないうちはこれで足りる。
