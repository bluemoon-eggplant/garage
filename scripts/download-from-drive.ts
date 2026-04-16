/**
 * Google DriveからPDFをダウンロードするスクリプト
 *
 * 前提:
 *   - Google Cloud Console でサービスアカウントを作成済み
 *   - Google Drive API を有効化済み
 *   - Drive内のフォルダをサービスアカウントと共有済み
 *
 * Drive フォルダ構成:
 *   📁 (DRIVE_FOLDER_ID)
 *     📁 mazda-rx7/
 *       📄 receipt1.pdf
 *     📁 rover-mini/
 *       📄 receipt2.pdf
 *
 * 使い方:
 *   1. .env に設定を追加
 *   2. yarn download-receipts
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- Config ---

const VALID_CATEGORIES = [
  'mazda-rx7',
  'eunos-roadstar',
  'rover-mini',
  'caterham-7',
  'kawasaki-zx14',
  'yamaha-renaissa',
  'yamaha-maxam',
];

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const INPUT_DIR = path.join(SCRIPTS_DIR, 'input');
const MANIFEST_PATH = path.join(INPUT_DIR, '.downloaded-ids.json');

// --- Main ---

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const folderId = process.env.DRIVE_FOLDER_ID;

  if (!keyPath) {
    console.error('Error: GOOGLE_SERVICE_ACCOUNT_KEY_PATH が .env に設定されていません');
    console.error('');
    console.error('セットアップ手順:');
    console.error('1. Google Cloud Console (https://console.cloud.google.com/)');
    console.error('2. プロジェクト作成 → Google Drive API 有効化');
    console.error('3. 認証情報 → サービスアカウント作成 → JSONキー発行');
    console.error('4. .env に GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./path/to/key.json を追加');
    process.exit(1);
  }

  if (!folderId) {
    console.error('Error: DRIVE_FOLDER_ID が .env に設定されていません');
    console.error('');
    console.error('Google DriveのフォルダURLからIDを取得:');
    console.error('https://drive.google.com/drive/folders/XXXXXXX ← このXXXXXXX部分');
    process.exit(1);
  }

  if (!fs.existsSync(keyPath)) {
    console.error(`Error: サービスアカウントキーファイルが見つかりません: ${keyPath}`);
    process.exit(1);
  }

  // Authenticate
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const drive = google.drive({ version: 'v3', auth });

  // Ensure input directory exists
  fs.mkdirSync(INPUT_DIR, { recursive: true });

  // Load manifest of previously downloaded file IDs
  const downloadedIds = loadManifest();

  // List category subfolders in Drive
  console.log('Driveフォルダを読み込み中...');
  const categoryFolders = await listFolders(drive, folderId);

  if (categoryFolders.length === 0) {
    console.log('フォルダが見つかりません。Drive内に車両カテゴリ名のフォルダを作成してください。');
    console.log(`有効なカテゴリ: ${VALID_CATEGORIES.join(', ')}`);
    return;
  }

  let totalDownloaded = 0;
  let totalSkipped = 0;

  for (const folder of categoryFolders) {
    const category = folder.name!;

    if (!VALID_CATEGORIES.includes(category)) {
      console.warn(`  スキップ: "${category}" は有効なカテゴリではありません`);
      continue;
    }

    console.log(`\n📁 ${category}/`);

    // Ensure local category directory exists
    const localDir = path.join(INPUT_DIR, category);
    fs.mkdirSync(localDir, { recursive: true });

    // List files (PDFs + images) in this category folder
    const files = await listReceiptFiles(drive, folder.id!);

    if (files.length === 0) {
      console.log('  ファイルなし');
      continue;
    }

    for (const file of files) {
      // Skip if this Drive file ID was already downloaded
      if (downloadedIds.has(file.id!)) {
        console.log(`  ✓ ${file.name} (ダウンロード済み)`);
        totalSkipped++;
        continue;
      }

      // Download to buffer first
      const buffer = await downloadFileToBuffer(drive, file.id!);
      const targetPath = path.join(localDir, file.name!);

      if (fs.existsSync(targetPath)) {
        const existing = fs.readFileSync(targetPath);
        if (buffer.equals(existing)) {
          // Same content already on disk (pre-manifest) — just register ID
          console.log(`  ✓ ${file.name} (既存と同一、ID登録)`);
          downloadedIds.add(file.id!);
          totalSkipped++;
          continue;
        }
        // Different content with same name — save with suffix
        const uniquePath = resolveUniquePath(localDir, file.name!);
        const localName = path.basename(uniquePath);
        console.log(`  ↓ ${localName} ...`);
        fs.writeFileSync(uniquePath, buffer);
      } else {
        console.log(`  ↓ ${file.name} ...`);
        fs.writeFileSync(targetPath, buffer);
      }

      downloadedIds.add(file.id!);
      totalDownloaded++;
    }
  }

  console.log(`\n--- 完了 ---`);
  console.log(`ダウンロード: ${totalDownloaded}件 / スキップ: ${totalSkipped}件`);
  console.log(`出力先: ${INPUT_DIR}`);

  // Save manifest
  saveManifest(downloadedIds);

  if (totalDownloaded > 0) {
    console.log('\n次のステップ: yarn extract-receipts');
  }
}

// --- Functions ---

interface DriveFile {
  id: string | null;
  name: string | null;
}

async function listFolders(
  drive: ReturnType<typeof google.drive>,
  parentId: string
): Promise<DriveFile[]> {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });
  return (res.data.files || []) as DriveFile[];
}

async function listReceiptFiles(
  drive: ReturnType<typeof google.drive>,
  folderId: string
): Promise<DriveFile[]> {
  const mimeTypes = [
    "mimeType='application/pdf'",
    "mimeType='image/jpeg'",
    "mimeType='image/png'",
    "mimeType='image/webp'",
  ];
  const mimeFilter = mimeTypes.join(' or ');
  const res = await drive.files.list({
    q: `'${folderId}' in parents and (${mimeFilter}) and trashed=false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });
  return (res.data.files || []) as DriveFile[];
}

function loadManifest(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')) as string[];
    return new Set(data);
  } catch {
    return new Set();
  }
}

function saveManifest(ids: Set<string>): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify([...ids], null, 2), 'utf-8');
}

function resolveUniquePath(dir: string, filename: string): string {
  let candidate = path.join(dir, filename);
  if (!fs.existsSync(candidate)) return candidate;

  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base}_${suffix}${ext}`);
    suffix++;
  }
  return candidate;
}

async function downloadFileToBuffer(
  drive: ReturnType<typeof google.drive>,
  fileId: string
): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
