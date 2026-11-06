# DB

SQLite `data/db.sqlite`（`database/seed.py` で作成。`data/` は公開されない）

## 設計思想
- `wines`（code・name・short=略称）/ `suppliers`（code・name・invoice）は販売王のマスタの写し。月1回の取込は商品コード（仕入先コード）突合で上書き（upsert）。マスタに無い手動追加分は残る
- `learned`（仕入先＋仕入先品番 → 商品コード）と `serials`（日付ごとの伝票連番）は作り直しても消さない
- 検索は FTS5 trigram。名前を正規化（NFKC・小文字・空白記号除去・ヴ→ブ・長音除去）してから3文字単位で OR 検索し、bm25 順に上位10件を候補にする
- 生産者が先頭・末尾どちらにあっても、3文字単位なので順序に影響されない
- `drafts`（code, data JSON）: 画面で新規登録し、まだ商品台帳CSVに出していない商品。CSV出力で消える。登録時点で `wines` にも入るので次の照合から使える
- 書き込みは `with connect()` で必ずコミット/ロールバック・クローズ（失敗時にロックを残さない）
