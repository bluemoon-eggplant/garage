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

---

# ブログ写真管理

## 概要

ブログ記事に使う写真は Google Drive から取り込み、各車両の `_images/` ディレクトリに配置されます。

```
src/content/garage/
  fd3s/_images/
    PXL_20250524_140718562.jpg
  zx14/_images/
    PXL_20251220_081411235.jpg
```

## Google Drive フォルダ構成

Drive 上に車両スラッグ名のフォルダを作成し、写真を配置します。

```
📁 blog-photos (DRIVE_PHOTOS_FOLDER_ID)
  📁 fd3s/
    📷 PXL_20250524_140718562.jpg
  📁 zzr1400/          ← Drive上のフォルダ名（ローカルの zx14 に自動リマップ）
    📷 PXL_20251220_081411235.jpg
```

## 写真取り込み方法

```bash
# 全車両の写真をダウンロード
yarn download-photos

# 特定車両のみ
yarn download-photos zx14
yarn download-photos fd3s
```

処理済み写真はマニフェストで管理され、追加分のみダウンロードされます。

## ブログ記事への写真追加

取り込んだ写真は MDX ファイル内で import して使用します。

```mdx
import { Image } from 'astro:assets';
import { IMAGE_SIZES } from '@/constants/image';

import Img1 from '../../../garage/fd3s/_images/PXL_20250524_140718562.jpg';

<Image {...IMAGE_SIZES.FIXED.MDX_LG} src={Img1} alt="説明" />
```

## 有効なスラッグ

| スラッグ | 車両 | Driveフォルダ名 |
|---------|------|----------------|
| `fd3s` | Mazda RX-7 | fd3s |
| `roadstar` | Eunos Roadstar | roadstar |
| `mini` | Rover Mini | mini |
| `caterham7` | Caterham 7 | caterham7 |
| `zx14` | Kawasaki ZX-14 | zzr1400 |
| `renaissa250` | YAMAHA Renaissa | renaissa250 |
| `maxam` | Yamaha MAXAM | maxam |

## 環境変数

`.env` に以下を設定:

```
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./scripts/service-account-key.json
DRIVE_PHOTOS_FOLDER_ID=xxxxx
```

## サムネイル

ブログ記事の最初の画像 import が、記事一覧のサムネイルとして自動的に使用されます。
`heroImage` を frontmatter に設定する必要はありません。

---

## ファイル構成

```
scripts/
├── download-from-drive.ts   # Google DriveからPDFダウンロード
├── download-photos.ts       # Google Driveから写真ダウンロード
├── extract-receipts.ts      # Gemini APIで構造化データ抽出
├── service-account-key.json # GCPサービスアカウントキー (.gitignore)
├── input/                   # ダウンロードしたPDF (.gitignore)
│   └── {category}/
├── output/                  # 明細データ (.gitignore)
│   └── {category}/
│       └── YYYYMMDD-N.json  # ← 1明細1ファイル
└── README.md                # このファイル
```
