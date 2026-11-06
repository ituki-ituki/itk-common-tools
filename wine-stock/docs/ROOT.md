# wine-stock

## 目的
自然派ワイン卸（1店舗）向けの、超シンプルな在庫管理デモ。

## 骨子
- 画面なし。アプリにLLM呼び出しもない。Claude Code のセッションが唯一の入口。
- ハーネス = `CLAUDE.md` ＋ `.claude/*` ＋ `docs/*`。設計判断は `docs/` に置く。
- Claude は質問の解釈と回答の言い回しを担う。数値はすべてスクリプトが決定論的に出す。
- 流れは1つ：会話でJSONの必須項目を埋める → `wine.py` に渡す（詳細は API.md）。
- データは `db.sqlite`。`master/*.csv` から作る。当面はダミーデータ。
- hook で db への直接操作を禁止する。lint はなし。

## ユーザーがすること
1. これ何本ある？（在庫）
2. これいくらで仕入れた？（仕入履歴）
3. 何が何本売れた？（販売実績）
4. 仕入を登録する
5. 販売を登録する

## 構成
```
wine-stock/
  CLAUDE.md
  .claude/settings.json
  docs/
  master/   wines.csv buys.csv sales.csv
  seed.py   CSV → db.sqlite
  wine.py   5コマンド
  db.sqlite
```
