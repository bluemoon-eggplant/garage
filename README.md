# まこちゃんガレージ

車・バイクの整備記録とガレージライフを紹介する個人サイト。

**公開 URL**: https://bluemoon-eggplant.github.io/garage/

## 技術スタック

- [Astro](https://astro.build/) — 静的サイトジェネレーター
- React — ギャラリー・ライトボックス等のインタラクティブ UI
- Tailwind CSS — スタイリング
- GitHub Pages — ホスティング（push で自動デプロイ）

## 主な機能

- JA/EN 二言語対応（Claude CLI による自動翻訳）
- 車両別ガレージページ（写真ギャラリー、スペック表）
- 整備記録ページ（Google Sheets / PDF OCR からデータ取得）
- Google Analytics 4（コンバージョン計測）
- OG 画像自動生成（Satori + Sharp）
- RSS / JSON フィード、サイトマップ

## セットアップ

```bash
# パッケージインストール
pnpm install

# 開発サーバー起動
SITE_URL=http://localhost:3000 pnpm dev

# ビルド
SITE_URL=http://localhost:3000 pnpm build
```

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [`docs/README.md`](docs/README.md) | 運用ガイド（デプロイ、翻訳、画像、OCR、記録管理） |
| [`scripts/README.md`](scripts/README.md) | スクリプト詳細（整備記録データ管理、写真取り込み） |

## ライセンス

Fork 元: [nemanjam/nemanjam.github.io](https://github.com/nemanjam/nemanjam.github.io)
