# API

`/task/api/`（ログイン必須）

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/tasks` | 未完了を新しい順 |
| POST | `/tasks` | `{name}` で追加 |
| PATCH | `/tasks/{id}` | `{done}` または `{memo}` を更新 |
