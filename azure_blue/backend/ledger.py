import csv
import io

from db import sjis

NAMES = """商品コード 商品名 商品名フリガナ 商品名略称 商品種別 拡張商品コード イニシャルキーカナ（商品） イニシャルキー英字（商品）
商品区分１ 商品区分２ 商品区分３ 付箋１ 付箋２ 規格・型番使用区分 規格・型番 カラー使用区分 カラー サイズ使用区分 サイズ 数量単位
販売入数 仕入入数 計算式コード ワレモノ印刷 ナマモノ印刷 主要仕入先コード１ 主要倉庫コード１ 発注ロット リードタイム 標準小売単価（上代）
標準売値 売値１ 売値２ 売値３ 原単価 最低販売警告見積 最低販売警告受注 最低販売警告売上 最低販売価格 標準仕入価格
仕入値１ 仕入値２ 仕入値３ 仕入伝票最新単価区分 販売時課税区分 仕入時課税区分 簡易課税商品区分 在庫管理有無 在庫管理開始日 在庫評価法
平均原価 最終仕入値 在庫繰越基準日 基準日原単価 在庫繰越数 上限在庫数 適正在庫数 最低販売周期 周期当たり販売数 受託商品区分""".split()
HEADER = [f"商品台帳.{n}" for n in NAMES]
BLANK = {6, 9, 10, 11, 15, 17, 19, 20, 26, 27, 49, 53}
FIXED = {5: "1", 12: "1", 24: "1", 25: "1", 45: "1", 46: "1"}
FIELDS = {1: "code", 2: "name", 3: "kana", 4: "short", 7: "initial_kana", 8: "initial_en", 30: "retail", 31: "price", 32: "price1", 35: "cost", 40: "cost"}


def row(item: dict) -> list[str]:
    cols = {i: "" if i in BLANK else "0" for i in range(1, len(HEADER) + 1)} | FIXED
    cols |= {i: str(item.get(key, "")) for i, key in FIELDS.items()}
    return [cols[i] for i in range(1, len(HEADER) + 1)]


def build(items: list[dict]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\r\n")
    writer.writerow(HEADER)
    writer.writerows(row(i) for i in items)
    return sjis(buf.getvalue())
