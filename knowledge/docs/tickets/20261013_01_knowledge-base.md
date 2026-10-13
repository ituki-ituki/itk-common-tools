# 20261013_01 knowledge-base

坂本のノウハウを PocketBase に貯め、Claude Code から引き出せるようにする。

## やること

- [x] PocketBase に `knowledge` コレクションを追加（`/root/pocketbase/pb_migrations/1792000000_create_knowledge.js`、ルールは superuser のみ）
- [x] Claude Code 用 superuser（claude-code@yama-gara.com）を作成し、認証情報を `/root/common/.env` に置く
- [x] `knowledge/kb.py`（list / add / add-many / update / delete）
- [x] 手元のノウハウ52件を投入（原文そのまま、重複1件は除外）
- [x] スキル `/root/common/.claude/skills/knowledge/SKILL.md` を作成（.gitignore は skills だけ追跡するよう変更）
- [x] 呼び出しの動作確認
