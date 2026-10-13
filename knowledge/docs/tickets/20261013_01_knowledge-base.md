# 20261013_01 knowledge-base

坂本のノウハウを PocketBase に貯め、Claude Code から引き出せるようにする。

## やること

- [ ] PocketBase に `knowledge` コレクションを追加（migration、ルールは superuser のみ）
- [ ] Claude Code 用 superuser を作成し、認証情報を `/root/common/.env` に置く
- [ ] `knowledge/kb.py`（list / add / add-many / update / delete）
- [ ] 手元のノウハウ52件を投入（原文そのまま、重複1件は除外）
- [ ] スキル `/root/common/.claude/skills/knowledge/SKILL.md` を作成
- [ ] 呼び出し・抽出の動作確認
