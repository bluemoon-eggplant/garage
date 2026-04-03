/**
 * Google Driveから写真をダウンロードして _images/ に配置するスクリプト
 *
 * 前提:
 *   - Google Cloud Console でサービスアカウントを作成済み
 *   - Google Drive API を有効化済み
 *   - Drive内のフォルダをサービスアカウントと共有済み
 *
 * Drive フォルダ構成:
 *   📁 blog-photos (DRIVE_PHOTOS_FOLDER_ID)
 *     📁 fd3s/
 *       📷 oil-change-1.jpg
 *     📁 zzr1400/
 *       📷 chain-replace.jpg
 *
 * 同期先:
 *   📁 fd3s/  → src/content/garage/fd3s/_images/
 *
 * 使い方:
 *   yarn download-photos          # 全車両
 *   yarn download-photos fd3s     # 特定車両のみ
 */

import 'dotenv/config';
import { google } from 'googleapis';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- Config ---

const VALID_SLUGS = [
  'fd3s',
  'roadstar',
  'mini',
  'caterham7',
  'zx14',
  'renaissa250',
  'maxam',
];

/** Drive folder name → local garage slug (when they differ) */
const SLUG_REMAP: Record<string, string> = {
  zzr1400: 'zx14',
};

const IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const PROJECT_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const GARAGE_DIR = path.join(PROJECT_ROOT, 'src/content/garage');
const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const MANIFEST_PATH = path.join(SCRIPTS_DIR, 'input', '.downloaded-photo-ids.json');

// --- Main ---

async function main() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const folderId = process.env.DRIVE_PHOTOS_FOLDER_ID;
  const filterSlug = process.argv[2];

  if (filterSlug && !VALID_SLUGS.includes(filterSlug)) {
    console.error(`Error: "${filterSlug}" は有効なスラッグではありません`);
    console.error(`有効なスラッグ: ${VALID_SLUGS.join(', ')}`);
    process.exit(1);
  }

  if (!keyPath) {
    console.error('Error: GOOGLE_SERVICE_ACCOUNT_KEY_PATH が .env に設定されていません');
    process.exit(1);
  }

  if (!folderId) {
    console.error('Error: DRIVE_PHOTOS_FOLDER_ID が .env に設定されていません');
    console.error('');
    console.error('セットアップ:');
    console.error('1. Google Drive に blog-photos フォルダを作成');
    console.error('2. サービスアカウントとフォルダを共有');
    console.error('3. .env に DRIVE_PHOTOS_FOLDER_ID=xxxxx を追加');
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

  // Load manifest
  const downloadedIds = loadManifest();

  // List slug subfolders in Drive
  console.log('Driveフォルダを読み込み中...');
  const slugFolders = await listFolders(drive, folderId);

  if (slugFolders.length === 0) {
    console.log('フォルダが見つかりません。Drive内に車両スラッグ名のフォルダを作成してください。');
    console.log(`有効なスラッグ: ${VALID_SLUGS.join(', ')}`);
    return;
  }

  let totalDownloaded = 0;
  let totalSkipped = 0;

  for (const folder of slugFolders) {
    const slug = folder.name!;

    const localSlug = SLUG_REMAP[slug] ?? slug;

    if (!VALID_SLUGS.includes(localSlug)) {
      console.warn(`  スキップ: "${slug}" は有効なスラッグではありません`);
      continue;
    }

    if (filterSlug && localSlug !== filterSlug) continue;

    console.log(`\n📁 ${slug}/ → ${localSlug}/`);

    // Ensure local _images directory exists
    const localDir = path.join(GARAGE_DIR, localSlug, '_images');
    fs.mkdirSync(localDir, { recursive: true });

    // List images in this folder
    const images = await listImages(drive, folder.id!);

    if (images.length === 0) {
      console.log('  画像なし');
      continue;
    }

    for (const file of images) {
      if (downloadedIds.has(file.id!)) {
        console.log(`  ✓ ${file.name} (ダウンロード済み)`);
        totalSkipped++;
        continue;
      }

      const buffer = await downloadFileToBuffer(drive, file.id!);
      const targetPath = path.join(localDir, file.name!);

      if (fs.existsSync(targetPath)) {
        const existing = fs.readFileSync(targetPath);
        if (buffer.equals(existing)) {
          console.log(`  ✓ ${file.name} (既存と同一、ID登録)`);
          downloadedIds.add(file.id!);
          totalSkipped++;
          continue;
        }
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

  saveManifest(downloadedIds);

  if (totalDownloaded > 0) {
    console.log('\n次のステップ: git add & commit (pre-commit hookで自動リサイズされます)');
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

async function listImages(
  drive: ReturnType<typeof google.drive>,
  folderId: string
): Promise<DriveFile[]> {
  const mimeFilter = IMAGE_MIMETYPES.map((m) => `mimeType='${m}'`).join(' or ');
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
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
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
