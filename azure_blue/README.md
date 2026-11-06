# azure_blue — 納品書 → 販売王

ワインの納品書を撮影し、販売王「仕入伝票(販売王22〜形式)」のCSVにする。

## 概念
写真 → Geminiで読み取り（`backend/prompts/read.md`）→ 仕入先は登録番号、ワインは品番学習 or FTS5候補＋Gemini選択（`pick.md`）→ 画面で確認 → CSV

## 構成
- `frontend/` 画面（Alpine.js + Tailwind）
- `backend/` FastAPI（`/scan` `/masters` `/export`）
- `database/` スキーマ・テスト用マスタCSV・`seed.py`
- `data/db.sqlite` 本番DB（git管理外）

## 設定
- APIキー: `/root/assets/private/.env` の `GEMINI_API_KEY`
- モデル: 既定 `gemini-3.5-flash-lite`（`AZURE_MODEL` で変更）
- サービス: `systemctl restart azure-blue`（127.0.0.1:1012）
- nginx: demo.yama-gara.com の `/azure_blue/`（ログイン必須）

## セットアップ
```
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python database/seed.py
```

## マスタ更新
本番マスタは `data/wines.csv`・`data/suppliers.csv` に置いて `seed.py`（git管理外。無ければ `database/` のテスト用を使う）。UTF-8 / Shift_JIS どちらも可。品番学習と伝票連番は残る。

- wines.csv: `code,name`（販売王の商品コード・商品名）
- suppliers.csv: `code,name,invoice`（invoice＝登録番号。任意。列ごと省略可）
