# 整備記録データ管理

## 概要

整備記録は `scripts/output/<category>/` 配下に **1明細1ファイル** で管理されています。
ファイルを追加・編集すると、一覧テーブルと明細ページの両方に反映されます。

```
scripts/output/
  mazda-rx7/
    20090627-0.json    ← 2009/06/27 の1件目
    20240115-0.json
    20240115-1.json    ← 同日2件目
  rover-mini/
    20231020-0.json
```

## データ追加方法

### 方法1: 領収書PDFからの自動抽出

```bash
# 1. Google DriveにPDFを配置（車両カテゴリ別フォルダ）
# 2. ダウンロード
yarn download-receipts

# 3. Gemini APIで構造化データ抽出
yarn extract-receipts

# 4. 確認
yarn dev
```

処理済みPDFはスキップされるので、追加分のみ処理されます。

### 方法2: 手動入力（DIY整備・例外など）

`scripts/output/<category>/` に JSON ファイルを作成します。

#### 手順

1. 対象カテゴリのフォルダに `YYYYMMDD-0.json` の形式でファイルを作成
2. 同日に複数ある場合は末尾の番号をインクリメント（`-1`, `-2`, ...）
3. 以下のテンプレートを記入して保存
4. `yarn dev` で確認

#### テンプレート

```json
{
  "source": "manual",
  "category": "カテゴリ名",
  "data": {
    "date": "YYYY/MM/DD",
    "totalAmount": 合計金額,
    "items": [
      { "description": "作業内容", "amount": 金額またはnull }
    ],
    "mileage": 走行距離またはnull,
    "shop": "整備店名またはDIY"
  },
  "reviewStatus": "confirmed"
}
```

#### 記入例: DIYオイル交換

ファイル: `scripts/output/mazda-rx7/20260310-0.json`

```json
{
  "source": "manual",
  "category": "mazda-rx7",
  "data": {
    "date": "2026/03/10",
    "totalAmount": 4500,
    "items": [
      { "description": "エンジンオイル交換 5W-30 4L", "amount": 3500 },
      { "description": "ドレンワッシャー", "amount": 200 },
      { "description": "廃油処理パック", "amount": 800 }
    ],
    "mileage": 95000,
    "shop": "DIY"
  },
  "reviewStatus": "confirmed"
}
```

#### 記入例: 部品のみ購入（通販）

ファイル: `scripts/output/mazda-rx7/20260215-0.json`

```json
{
  "source": "manual",
  "category": "mazda-rx7",
  "data": {
    "date": "2026/02/15",
    "totalAmount": 12800,
    "items": [
      { "description": "NGK スパークプラグ RE7C-L x2", "amount": 12800 }
    ],
    "mileage": null,
    "shop": "Amazon"
  },
  "reviewStatus": "confirmed"
}
```

## 有効なカテゴリ名

| カテゴリ名 | 車両 |
|-----------|------|
| `mazda-rx7` | Mazda RX-7 |
| `eunos-roadstar` | Eunos Roadstar |
| `rover-mini` | Rover Mini |
| `caterham-7` | Caterham 7 |
| `kawasaki-zx14` | Kawasaki ZX-14 |
| `yamaha-renaissa` | YAMAHA Renaissa |
| `yamaha-maxam` | Yamaha MAXAM |

## 分類について

作業内容（description）はビルド時にキーワードで自動分類されます。

| 分類 | キーワード例 |
|------|-------------|
| 主要消耗品交換 | エンジンオイル, オイルエレメント, スパークプラグ, 冷却水, ブレーキフルード, バッテリー, タイヤ |
| 機関整備 | エンジン, キャブレター, 点火, アペックスシール |
| 冷却系整備 | ラジエーター, サーモスタット, ウォーターポンプ |
| 制動系整備 | ブレーキ, パッド, キャリパー |
| 駆動系整備 | クラッチ, ミッション, デフ, チェーン |
| 板金 | 板金, 塗装, バンパー |
| その他整備 | 上記に該当しないもの |

キーワードの定義は `src/constants/record.ts` にあります。

## ファイル構成

```
scripts/
├── download-from-drive.ts   # Google DriveからPDFダウンロード
├── extract-receipts.ts      # Gemini APIで構造化データ抽出
├── service-account-key.json # GCPサービスアカウントキー (.gitignore)
├── input/                   # ダウンロードしたPDF (.gitignore)
│   └── {category}/
├── output/                  # 明細データ (.gitignore)
│   └── {category}/
│       └── YYYYMMDD-N.json  # ← 1明細1ファイル
└── README.md                # このファイル
```
