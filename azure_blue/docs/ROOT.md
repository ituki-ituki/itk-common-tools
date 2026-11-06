# azure_blue

## 目的
ワインの納品書をカメラで連続スキャンし、販売王の「仕入伝票」テキストデータ入力にそのまま取り込めるCSVを作る。

## 全体像
1. スキャン画面（スマホのカメラ）で納品書を複数枚撮る
2. Geminiが仕入先名と明細を抽出（生産者 / 銘柄 / ヴィンテージ / 単価 / 数量 / 税抜金額）
3. 仕入先は登録番号で決定（なければ名前検索）
4. ワインは品番学習 → なければFTS5候補上位10件からGeminiが1件選ぶ（該当なしは null）
5. 確認画面：マスタに無い行は「新規」。違えば「変更」で検索選択、不要な行は×で削除。新規があれば「次へ」で新規商品登録
6. 納品書1枚ごとに合計数量が12の倍数でなければ警告（エクスポートは止めない）
7. 販売王の仕入伝票フォーマットのCSVでエクスポート

## 構成
- 配置: https://demo.yama-gara.com/azure_blue/ （API: `/azure_blue/api/` → 127.0.0.1:1012、systemd `azure-blue`）
- backend: FastAPI + google-genai（beer-monitorと同じ構成）
- APIキー: `/root/assets/private/.env` の `GEMINI_API_KEY`（サーバー側のみ）
- モデル: `gemini-3.5-flash-lite`（環境変数 `AZURE_MODEL` で変更可）
- プロンプト: `backend/prompts/read.md`（読み取り）・`pick.md`（候補選択）
- DB: SQLite（ワインマスタ = 販売王の商品台帳、仕入先マスタ = 販売王の仕入先台帳）
- アクセス: 非公開・ログイン必須（access.json）
- 他ツール（wine-stock）とは連携しない
