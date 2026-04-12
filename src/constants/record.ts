import type { ConsumableTag, MaintenanceCategory } from '@/types/record';

export const CONSUMABLE_TAGS: ConsumableTag[] = [
  'エンジンオイル',
  'オイルエレメント',
  'エアクリーナー',
  'スパークプラグ',
  '冷却水',
  'ブレーキフルード',
  'バッテリー',
  'タイヤ',
  'ミッションオイル',
  'デフオイル',
];

export const MAINTENANCE_CATEGORIES: Record<MaintenanceCategory, string> = {
  consumable: '主要消耗品交換',
  inspection: '定期点検',
  engine: '機関',
  cooling: '冷却系',
  braking: '制動系',
  suspension: '足回り',
  drivetrain: '駆動系',
  interior: '内外装',
  bodywork: '板金',
  other: 'その他',
};

export const MAINTENANCE_TAG_COLORS: Record<MaintenanceCategory, string> = {
  consumable: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  inspection: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
  engine: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  cooling: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  braking: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
  suspension: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  drivetrain: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200',
  interior: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-200',
  bodywork: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-200',
};

export const MAINTENANCE_CATEGORY_EN: Record<MaintenanceCategory, string> = {
  consumable: 'Consumable',
  inspection: 'Inspection',
  engine: 'Engine',
  cooling: 'Cooling',
  braking: 'Braking',
  suspension: 'Suspension',
  drivetrain: 'Drivetrain',
  interior: 'Interior/Exterior',
  bodywork: 'Body & Paint',
  other: 'Other',
};

export const CONSUMABLE_TAG_EN: Record<ConsumableTag, string> = {
  'エンジンオイル': 'Engine Oil',
  'オイルエレメント': 'Oil Filter',
  'エアクリーナー': 'Air Filter',
  'スパークプラグ': 'Spark Plug',
  '冷却水': 'Coolant',
  'ブレーキフルード': 'Brake Fluid',
  'バッテリー': 'Battery',
  'タイヤ': 'Tires',
  'ミッションオイル': 'Transmission Oil',
  'デフオイル': 'Differential Oil',
};

export const CLASSIFICATION_KEYWORDS: Record<string, string[]> = {
  inspection: [
    'マツダセーフティーチェック', 'パックdeメンテ', '安心点検', '車検整備', '車検基本点検', 'ホウレイ', '法令',
  ],
  consumable: [
    'エンジンオイル', 'オイル交換', 'ROTARY-1', '5W-30', '10W-40', 'オイルエレメント', 'オイルフィルター交換',
    'エアエレメント', 'エアークリーナー',
    'スパークプラグ', 'スパーク・プラグ', 'プラグ交換', 'プラグ取替', 'プラグセット', '冷却水', 'LLC', 'クーラント',
    'ブレーキフルード', 'ブレーキオイル', 'バッテリー', 'バツテリー',
    'タイヤ交換', 'タイヤ組替', 'タイヤ購入',
    'ミッションオイル', 'デフオイル',
  ],
  engine: [
    'エンジン', 'キャブレター', 'インジェクタ', '点火', 'イグニッション',
    'ローター', 'アペックスシール', 'タイミング',
    'プラグコード', 'ダイレクトイグニッション', 'ハイテンションコード',
    'フューエル・フィルタ', 'フューエルフィルター', 'ソレノイドバルブ', 'FUEL',
  ],
  cooling: [
    'ラジエーター', 'ラジエター', 'サーモスタット', 'ウォーターポンプ',
    '冷却', 'ファン', 'ヒーター', 'エアセパレートタンク',
  ],
  interior: [
    'シフトレバー', 'シフトブーツ', 'グローブボックス',
    'キーシリンダー', 'オーディオ', '張替', 'カウル', 'フード', 'レギュレターチャンネル', 'シーリング',
    'マッド', 'サイドブレーキブーツ', 'チェンジレバーブーツ', 'チェンジレバーノブ', 'カセットデッキ',
    'シガーライター', 'アッシュトレー', '灰皿', 'ガラス交換', 'ドア交換',
  ],
  bodywork: [
    '板金', '塗装', 'ペイント', 'ボディ', 'パネル', 'バンパー', 'フェンダー',
  ],
  braking: [
    'ブレーキ', 'ディスク', 'ブレーキパッド', 'キャリパー', 'マスターシリンダー', 'ディクセル',
  ],
  suspension: [
    'サスペンション', 'トーコン', 'ショックアブソーバー', 'ステムベアリング',
    'ラジアスアーム', 'キャンバー', 'フォーク',
  ],
  drivetrain: [
    'クラッチ', 'ミッション', 'トランスミッション', 'デフ', 'ドライブシャフト',
    'プロペラシャフト', 'タイミングチェーン', 'ドライブチェーン', 'スプロケット',
    'フライホイール',
  ],
};

/** Exclude descriptions containing these keywords from consumable tag matching */
export const CONSUMABLE_TAG_EXCLUSIONS: string[] = [
  '漏れ', '洗浄', '点検', 'テスト', '診断', '液補充', 'ご希望', '弱い', '燃焼状態', '汚れ', 'ホースバンド', 'カバー',
];

/** Map description keywords to specific consumable tags */
export const CONSUMABLE_TAG_KEYWORDS: Record<ConsumableTag, string[]> = {
  'ミッションオイル': ['ミッションオイル'],
  'デフオイル': ['デフオイル'],
  'エンジンオイル': ['エンジンオイル', 'オイル交換', 'オイルチケット', 'ROTARY-1', '5W-30', '10W-40'],
  'オイルエレメント': ['オイルエレメント', 'オイルフィルター交換', 'オイルフィルター', 'カートリッジ、オイルフィルター'],
  'エアクリーナー': ['エアエレメント', 'エアークリーナー'],
  'スパークプラグ': ['スパークプラグ', 'スパーク・プラグ', 'プラグ交換', 'プラグ取替', 'プラグセット、スパーク', 'プラグセット', 'CR9EIA'],
  '冷却水': ['冷却水', 'LLC', 'クーラント'],
  'ブレーキフルード': ['ブレーキフルード', 'ブレーキオイル'],
  'バッテリー': ['バッテリー', 'バツテリー', 'BATTERY'],
  'タイヤ': ['タイヤ交換', 'タイヤ組替', 'タイヤ購入', 'ミシュラン', 'DUNLOP', 'PIRELLI'],
};
