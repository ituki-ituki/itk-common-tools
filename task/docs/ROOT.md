# task

## 目的
社内で共有するシンプルなタスク一覧。作って、終わったらチェックで消す。

## 全体像
- 表形式：ID・タスク名・作成日・完了チェック・備忘
- 新しい順に表示。チェックした行は即非表示（二度と表示しない）
- 追加のみ。タスク名の編集・削除はしない。備忘は書き換えられる

## 構成
- URL: base.yama-gara.com/task/（非公開・ログイン必須）
- 画面: `index.html` + `app.js`（Alpine.js + Tailwind）
- API: `main.py`（FastAPI、`task.service`、127.0.0.1:1013）。nginx `/task/api/` → 1013
- DB: `data/db.sqlite`（全員共有。`data/` は配信しない）
