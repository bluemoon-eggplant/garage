# CLAUDE.md

Astro ブログ/ガレージサイト。

## ブログ写真の取り込み

「blogphotoを取り込んで」と言われたら:

```bash
# 1. Google Driveからダウンロード
npx tsx scripts/download-photos.ts              # 全車両
npx tsx scripts/download-photos.ts renaissa250  # 特定スラッグのみ

# 2. 新規ファイルを1600px幅にリサイズ
sips --resampleWidth 1600 src/content/garage/<slug>/_images/<新ファイル>.jpg
```

3. 指定されたMDX記事にimportを追加:

```mdx
import { Image } from 'astro:assets';
import { IMAGE_SIZES } from '@/constants/image';
import Img1 from '../../../garage/<slug>/_images/<filename>.jpg';

<Image {...IMAGE_SIZES.FIXED.MDX_LG} src={Img1} alt="説明" />
```

- Drive構成: `blog-photos/<slug>/` (DRIVE_PHOTOS_FOLDER_ID)
- ダウンロード先: `src/content/garage/<slug>/_images/`
- 有効スラッグ: fd3s, roadstar, mini, caterham7, zx14, renaissa250, maxam
- リマップ: Drive `zzr1400` → local `zx14`

## レシートPDFの取り込み

「取り込んで」「PDFを追加した」と言われたら:

```bash
# 1. Google DriveからPDFをダウンロード
npx tsx scripts/download-from-drive.ts

# 2. PDFからレコードJSONを抽出（Gemini API）
npx tsx scripts/extract-receipts.ts
```

- カテゴリ: mazda-rx7, eunos-roadstar, rover-mini, caterham-7, kawasaki-zx14, yamaha-renaissa, yamaha-maxam
- 取り込み後に重複確認を推奨（同日の -0 と -1 が同内容の場合あり）

## 画像リサイズ

```bash
sips --resampleWidth 1600 path/to/image.jpg     # 推奨幅
sips -g pixelWidth -g pixelHeight path/to/image.jpg  # サイズ確認
```
