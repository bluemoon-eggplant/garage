# scripts/

整備記録データ管理・写真取り込み・翻訳に関するスクリプト群。

運用手順は **[docs/README.md](../docs/README.md)** を参照。

## スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `download-from-drive.ts` | Google Drive から領収書 PDF をダウンロード |
| `download-photos.ts` | Google Drive から写真をダウンロード → `_images/` に配置 |
| `extract-receipts.ts` | Gemini API で PDF → JSON 構造化データ抽出 |
| `translate-en.mjs` | Claude CLI で MDX 記事本文を JA→EN 翻訳 |
| `sync-en-structure.mjs` | EN MDX の構造同期（import, 画像, frontmatter） |
| `sync-i18n-values.mjs` | i18n UI 文字列の自動翻訳（pre-commit hook） |
| `check-translations.mjs` | i18n キーの整合性チェック（pre-commit hook） |
| `check-garage-translations.mjs` | garage EN ファイル存在チェック（pre-commit hook） |
| `cleanup-unused-images.mjs` | 未使用画像の自動削除（pre-commit hook） |
| `resize-staged-images.mjs` | ステージ画像の自動リサイズ（pre-commit hook） |

## フォルダ構成

```
scripts/
├── input/                   # ダウンロードした PDF (.gitignore)
│   ├── {category}/
│   └── .downloaded-ids.json
├── output/                  # 抽出された整備記録 JSON
│   └── {category}/
│       └── YYYYMMDD-N.json
└── service-account-key.json # GCP サービスアカウントキー (.gitignore)
```
