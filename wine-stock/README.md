# wine-stock

自然派ワイン卸向けの在庫管理デモ。画面もアプリ内のLLMもなく、Claude Code との会話だけで使う。

## しくみ
- `CLAUDE.md`：在庫係としてのふるまい。会話でJSONを埋めて `wine.py` に渡す。
- `wine.py`：5コマンド（stock / buys / sales / buy / sell）。数はすべてここで決まる。
- `.claude/settings.json` ＋ `guard.py`：db.sqlite に直接触れる操作を hook で止める。
- `master/*.csv` → `seed.py` → `db.sqlite`。在庫は「仕入の合計 − 販売の合計」で毎回出す。

## セットアップ
```
cd wine-stock
python3 seed.py
claude
```
Python 3.11 以上。標準ライブラリだけで動く。`seed.py` を実行すると DB をダミーデータで作り直す。

## 設計
`docs/` を参照。
