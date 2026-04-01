
### Expose local dev webserver over ssh tunnel

```bash
ssh -R 1080:localhost:3000 ubuntu@152.70.160.21
curl http://152.70.160.21:1080

# shorter version
ssh -R 1080:localhost:3000 amd2
curl http://amd2.nemanjamitic.com:1080

# flush, works without server and ssh reboot
sudo iptables -F
# list
sudo iptables -L
# check
ss -tuln | grep 1080

# https tunnel
# MUST have *: before, important
# 1082 is tunnel only port, doesnt need to be opened on host 
ssh -R *:1082:localhost:3000 amd1c
https://preview.amd1.nemanjamitic.com
```

### Sitemap, RSS and Json feed links

```bash
# root
https://nemanjamitic.com/sitemap-index.xml

# all links
https://nemanjamitic.com/sitemap-0.xml

# robots.txt
https://nemanjamitic.com/robots.txt

# RSS
https://nemanjamitic.com/api/feed.xml

# Json
https://nemanjamitic.com/api/feed.json
```

### 画像の圧縮と配置

ブログ記事（特に History 系）で写真を多用する場合のワークフロー。

#### ディレクトリ構成

画像は記事ローカルの `_images/` フォルダに配置する。

```
src/content/post/
└── 2024/
    └── 03-30-my-history/
        ├── index.mdx
        └── _images/
            ├── photo1.jpg
            ├── photo2.jpg
            └── photo3.jpg
```

#### 画像リサイズ（macOS sips）

スマホ・カメラの写真はそのままだと大きすぎる（3000〜4000px）。
macOS 標準の `sips` コマンドで 1600px 幅にリサイズする。

```bash
# 記事の _images を一括リサイズ（アスペクト比維持）
sips --resampleWidth 1600 src/content/post/2024/03-30-my-history/_images/*

# サイズ確認
sips -g pixelWidth -g pixelHeight src/content/post/2024/03-30-my-history/_images/*

# garage の画像も同様
sips --resampleWidth 1600 src/content/garage/fd3s/_images/*
```

**推奨リサイズ幅:** 1600px（サイト表示最大1280pxに対して十分な余裕）

#### MDX での使い方

```mdx
import { Image } from 'astro:assets';
import { IMAGE_SIZES } from '@/constants/image';
import Photo1 from './_images/photo1.jpg';
import Photo2 from './_images/photo2.jpg';

<Image {...IMAGE_SIZES.FIXED.MDX_LG} src={Photo1} alt="説明文" />
<Image {...IMAGE_SIZES.FIXED.MDX_MD} src={Photo2} alt="説明文" />
```

主な IMAGE_SIZES:
| 定数 | 横幅 | 用途 |
|------|------|------|
| `MDX_SM` | 640px | 小さめ表示 |
| `MDX_MD` | 768px | 中サイズ |
| `MDX_LG` | 1024px | 標準（よく使う） |
| `MDX_XL` | 1280px | 大きめ表示 |

#### Gallery ページとの連携

`_images/` フォルダの画像は `/gallery/` ページにも自動表示される。
リンクは親記事（`/blog/{slug}`）に自動で紐づく。

#### 注意事項

- **フォーマット変換は不要** — Astro が webp/avif にビルド時変換する
- **リサイズは git add 前に行う** — 大きい画像をコミットするとリポジトリが膨れる
- **JPEG品質の追加圧縮** — 必要なら `sips --setProperty formatOptions 80 ファイル名`

### Record ページ — Google Sheets 連携

Record ページ (`/record/`) の維持記録データは Google Sheets から取得しています。

#### スプレッドシート

- **ID**: `1wdapx8Xli8JDL_0XaACwCV0zyeWtW5pQ9z2OSBU79Oc`
- **公開設定**: 「リンクを知っている全員」に閲覧権限が必要

#### シート名とカテゴリの対応

| シート名       | カテゴリ (slug)    |
|----------------|-------------------|
| (1枚目/gid=0)  | mazda-rx7         |
| Mini           | rover-mini        |
| ZZR1400        | kawasaki-zx14     |
| ロードスター    | eunos-roadstar    |
| ルネッサ        | yamaha-renaissa   |
| セブン          | caterham-7        |

※ 対応は `src/libs/google-sheets.ts` の `SHEET_MAP` で管理

#### カラム構成（共通）

各シートの先頭行（ヘッダー）は以下の通り：

| 列 | ヘッダー名    | 説明               |
|----|-------------|-------------------|
| A  | 支払日       | 日付 (YYYY/MM/DD)  |
| B  | 金額         | 金額（¥表記可）     |
| C  | 項目         | 整備内容の説明      |
| D  | 走行距離_km  | 走行距離（数値）    |
| E  | 整備店       | 整備した店名        |

※ F列以降に追加カラムがあっても無視されます

#### データ更新の手順

1. Google Sheets 上でデータを追加・編集する
2. サイトをビルドする（`pnpm build`）
3. ビルド時にシートのデータが取得され、静的HTMLに埋め込まれる

```bash
# ローカル確認
pnpm dev
# → http://localhost:3000/record/ でデータを確認

# 本番反映
pnpm build
```

#### 新しい車両シートの追加

1. スプレッドシートに新しいシートを追加（ヘッダー行は上記カラム構成に従う）
2. `src/libs/google-sheets.ts` の `SHEET_MAP` にエントリを追加：
   ```ts
   'category-slug': { sheet: 'シート名' },
   ```
3. `src/content/record/` に対応する MDX ファイルを作成（frontmatter のみ）：
   ```yaml
   ---
   title: 車両名 記録
   category: category-slug
   publishDate: YYYY-MM-DD
   ---
   ```
4. 必要に応じて `src/constants/collections.ts` の `CATEGORIES` にも追加