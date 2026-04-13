
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

### GitHub Pages デプロイ

サイトは GitHub Pages で公開されている。`master` ブランチへの push で自動デプロイされる。

- **リポジトリ**: `bluemoon-eggplant/garage`
- **公開 URL**: `https://bluemoon-eggplant.github.io/garage/`
- **ワークフロー**: `.github/workflows/gh-pages__deploy-astro.yml`

#### 仕組み

```
git push origin master
  ↓
GitHub Actions 起動 (gh-pages__deploy-astro.yml)
  ↓
withastro/action@v2 がビルド (astro build)
  ↓
actions/deploy-pages@v4 が GitHub Pages にデプロイ
  ↓
https://bluemoon-eggplant.github.io/garage/ に反映
```

#### 環境変数

ワークフロー内で直接設定されている：

| 変数 | 値 | 説明 |
|------|-----|------|
| `SITE_URL` | `https://bluemoon-eggplant.github.io/garage` | サイトURL（base パス含む） |
| `GA_MEASUREMENT_ID` | `G-9QJZT0X1GG` | Google Analytics 4 測定ID |

#### base パスの仕組み

`SITE_URL` に `/garage` が含まれるため、`astro.config.ts` で自動的に `base: '/garage'` が設定される。

```typescript
// astro.config.ts
const siteUrlObj = new URL(SITE_URL);
const basePath = siteUrlObj.pathname.replace(/\/$/, '') || undefined;
// → site: 'https://bluemoon-eggplant.github.io', base: '/garage'
```

コード内のパス処理：
- **内部リンク**: `localizedPath()` が自動で base を付加
- **静的ファイル（favicon, feed 等）**: `withBase()` で base を付加
- **フル URL（OG画像, feed URL 等）**: `${SITE_URL}${ROUTES.XXX}` で SITE_URL に base が含まれるためそのまま動作

#### ローカルでの確認

```bash
# base なし（通常の開発）
SITE_URL=http://localhost:3000 pnpm dev

# base あり（デプロイ前の確認）
SITE_URL=http://localhost:3000/garage pnpm build && pnpm preview
# → http://localhost:3000/garage/ で動作確認
```

#### 手動デプロイ

通常は push で自動デプロイだが、手動で再デプロイしたい場合：

```bash
# GitHub Actions のワークフローを手動実行
gh workflow run "Deploy to GitHub Pages with Astro action" --repo bluemoon-eggplant/garage

# デプロイ状況を確認
gh run list --repo bluemoon-eggplant/garage --limit 3
gh run watch --repo bluemoon-eggplant/garage
```

### コミット時の自動処理（pre-commit hook）

`git commit` を実行すると、pre-commit hook（`.githooks/pre-commit`）が以下の処理を順番に実行する。

```
git commit
  ↓
┌─────────────────────────────────────────────────────────┐
│ 1. 未使用画像の削除        (cleanup-unused-images.mjs)  │
│ 2. EN 構造の同期           (sync-en-structure.mjs)  ❌  │
│ 3. i18n 値の自動翻訳       (sync-i18n-values.mjs)      │
│ 4. i18n キーの整合性チェック (check-translations.mjs) ❌ │
│ 5. garage EN ファイル存在チェック                     ❌  │
│                        (check-garage-translations.mjs)  │
│ 6. 画像の自動リサイズ      (resize-staged-images.mjs)   │
└─────────────────────────────────────────────────────────┘
  ↓ (❌ = 失敗時コミットをブロック)
コミット完了
```

#### 1. 未使用画像の削除

`scripts/cleanup-unused-images.mjs`

`_images/` ディレクトリにある画像のうち、どの MDX ファイルからも参照されていないものを自動削除する。ステージングからも除外される。

#### 2. EN 構造の同期（ブロッキング）

`scripts/sync-en-structure.mjs`

日本語 MDX (`index.mdx`) と英語 MDX (`index.en.mdx`) の **構造的な要素** を自動同期する。テキストの翻訳はしない。

同期される要素：
- **frontmatter**（garage のみ）: JA の frontmatter をそのまま EN にコピー
- **import 文**: JA にあって EN にない import を自動追加
- **`<Image>` コンポーネント**: JA と同じ位置に EN でも配置
- **末尾スペース**: markdown の改行（`<br>`）用の末尾スペースを同期

失敗するとコミットがブロックされる。

#### 3. i18n 値の自動翻訳（Claude CLI）

`scripts/sync-i18n-values.mjs`

**UI 文字列の自動翻訳**。`src/i18n/ja.ts` がステージングに含まれている場合のみ動作する。

```
src/i18n/ja.ts に変更あり
  ↓
前回コミットとの差分を検出
  ↓
Claude CLI (haiku モデル) で JA→EN 翻訳
  ↓
src/i18n/en.ts を更新 & 自動ステージング
```

- **モデル**: `claude -p --model haiku --no-session-persistence`
- **対象**: 値が変更されたキーのみ（新規キー追加は別）
- 失敗してもコミットはブロックしない（次のチェックで検出される）

#### 4. i18n キーの整合性チェック（ブロッキング）

`scripts/check-translations.mjs`

`ja.ts` と `en.ts` のキーが一致しているか検証する。

- `ja.ts` にあって `en.ts` にないキー → **エラー（コミットブロック）**
- `en.ts` にあって `ja.ts` にないキー → 警告のみ

#### 5. garage EN ファイル存在チェック（ブロッキング）

`scripts/check-garage-translations.mjs`

すべての `src/content/garage/*/index.mdx` に対して `index.en.mdx` が存在するか検証する。不足していればコミットをブロックする。

#### 6. 画像の自動リサイズ

`scripts/resize-staged-images.mjs`

ステージされた `_images/` 内の画像が 1600px 幅を超えていたら `sharp` で自動リサイズし、再ステージングする。

### 自動翻訳の全体像

翻訳は **3 種類** あり、それぞれトリガーと実行内容が異なる。

| 種類 | 対象 | トリガー | 実行タイミング |
|------|------|---------|--------------|
| UI 文字列 | `src/i18n/ja.ts` → `en.ts` | `git commit`（pre-commit hook） | 自動 |
| 構造同期 | `index.mdx` → `index.en.mdx` の import/画像 | `git commit`（pre-commit hook） | 自動 |
| 記事本文 | `index.mdx` → `index.en.mdx` の文章 | Claude Code がセッション中に実行 | 半自動 |

#### UI 文字列の自動翻訳（コミット時・自動）

**トリガー**: `git commit` 実行時、`src/i18n/ja.ts` がステージに含まれている場合
**実行スクリプト**: `scripts/sync-i18n-values.mjs`（pre-commit hook から呼ばれる）

```
git commit
  ↓ pre-commit hook
ja.ts がステージにある？ → No → スキップ
  ↓ Yes
前回コミット (HEAD) との差分を検出
  ↓
変更された値を Claude CLI に送信
  $ claude -p --model haiku --no-session-persistence
  ↓
en.ts を更新 → 自動ステージング
```

ユーザーは何もしなくてよい。`ja.ts` を編集してコミットすれば `en.ts` は自動で追従する。

#### 構造同期（コミット時・自動）

**トリガー**: `git commit` 実行時、MDX ファイルがステージに含まれている場合
**実行スクリプト**: `scripts/sync-en-structure.mjs`（pre-commit hook から呼ばれる）

JA の MDX が変更されると、EN 側の **構造的な要素だけ** を自動同期する。文章は翻訳しない。

同期されるもの：
- frontmatter（garage のみ）
- import 文
- `<Image>` コンポーネントの位置
- 末尾スペース（markdown の `<br>` 用）

#### 記事本文の翻訳（Claude Code が実行・半自動）

**トリガー**: Claude Code が記事作成・編集のセッション中に実行
**実行スクリプト**: `scripts/translate-en.mjs`

記事本文（見出し、説明文、箇条書きなど）は pre-commit hook の対象外。Claude Code がコンテンツ作成の流れの中で翻訳スクリプトを実行するため、ユーザーが手動でコマンドを叩く必要はない。

```
Claude Code のセッション中:
  記事 (index.mdx) を作成・編集
  ↓
  $ node scripts/translate-en.mjs --file src/content/garage/fd3s/index.mdx
  ↓
スクリプトが index.mdx を読み込み
  ↓
frontmatter / import / 本文 を分離
  ↓
Claude CLI (haiku) で本文を JA→EN 翻訳
  ↓
index.en.mdx に書き込み → 自動ステージング
  ↓
  $ git commit → pre-commit hook で構造同期 & チェック
```

ユーザーが直接実行することもできる：

```bash
# ステージされた JA ファイルをまとめて翻訳
node scripts/translate-en.mjs

# 全ファイルを翻訳
node scripts/translate-en.mjs --all

# 特定ファイルを翻訳
node scripts/translate-en.mjs --file src/content/garage/fd3s/index.mdx

# 高品質翻訳（sonnet モデル使用、時間がかかる）
node scripts/translate-en.mjs --quality

# ドライラン（確認のみ）
node scripts/translate-en.mjs --dry-run
```

**モデルの使い分け:**
- デフォルト: **haiku**（高速、数秒〜十数秒）
- `--quality`: **sonnet**（高品質、数十秒〜数分）

翻訳時に保持されるもの：
- import 文、JSX コンポーネント、props
- 技術用語、ブランド名、型番、単位
- frontmatter の構造（title/description は翻訳される）

### 翻訳の裏側の仕組み

#### Claude CLI とは

翻訳スクリプト（`sync-i18n-values.mjs`、`translate-en.mjs`）は内部で **Claude Code CLI** の `claude -p`（パイプモード）を子プロセスとして実行している。

```
Node.js スクリプト
  ↓ execSync() でシェルコマンド実行
  $ claude -p --model haiku --system-prompt "翻訳ルール"
  ↓ stdin に JA 本文を流し込む
  claude CLI → Anthropic API に送信（認証はキーチェーンから自動）
  ↓ stdout に翻訳結果が返る
  Node.js が受け取って .en.mdx に書き込む
```

#### 認証

- `claude` コマンド初回起動時にブラウザで OAuth ログインした認証情報を使用
- 認証は **macOS キーチェーン** に保存されている（設定ファイルには書かれていない）
- 確認: `claude auth status` で認証状態・プラン・メールアドレスを確認できる
- API key の手動設定は不要

#### Claude Code セッション外でも動く

`claude` コマンドはスタンドアロンの CLI ツールなので、Claude Code のセッション（対話モード）が起動していなくても動作する。
コンソールから直接 `git commit` した場合でも、pre-commit hook 内の `claude -p` は正常に実行される。

必要な条件：
- `claude` コマンドにパスが通っていること
- `claude auth status` で `loggedIn: true` であること

#### 記事本文の翻訳は自動実行されない（重要）

pre-commit hook で**自動実行される**のは：
- i18n 値の翻訳（`sync-i18n-values.mjs`）
- 構造同期（`sync-en-structure.mjs`）
- 整合性チェック・画像リサイズ

記事本文の翻訳（`translate-en.mjs`）は **pre-commit hook に含まれていない**。

Claude Code セッション中は、Claude Code が「コミット前に翻訳が必要」と判断して `translate-en.mjs` を実行するが、これは Claude Code の判断であり、100% 実行される保証はない。

**コンソールから直接コミットする場合の安全策:**

pre-commit hook の `check-garage-translations.mjs` が EN ファイルの存在をチェックし、不足していればコミットをブロックする。その場合は手動で翻訳を実行する：

```bash
# ブロックされたら翻訳を実行
node scripts/translate-en.mjs --file src/content/garage/new-bike/index.mdx

# 再度コミット
git add . && git commit -m "新しいページ"
```

### 記事公開の全体フロー

```
1. 記事を書く
   src/content/garage/new-bike/index.mdx を作成
   src/content/garage/new-bike/_images/ に写真を配置

2. 翻訳する
   node scripts/translate-en.mjs --file src/content/garage/new-bike/index.mdx
   → index.en.mdx が生成される

3. コミットする
   git add .
   git commit -m "新しいバイクページを追加"
   → pre-commit hook が自動で:
     - 未使用画像を削除
     - EN 構造を同期
     - i18n 値を翻訳
     - 整合性をチェック
     - 画像を 1600px にリサイズ

4. push する
   git push origin master
   → GitHub Actions が自動で:
     - astro build を実行
     - GitHub Pages にデプロイ

5. 公開完了
   https://bluemoon-eggplant.github.io/garage/ に反映
```