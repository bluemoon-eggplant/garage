import type { CollectionEntry } from 'astro:content';

export type RecordCollection = CollectionEntry<'record'>;

export type Record = RecordCollection & {
  slug: RecordCollection['id'];
};

// --- Maintenance Record Types ---

export type MaintenanceCategory =
  | 'consumable'
  | 'inspection'
  | 'engine'
  | 'cooling'
  | 'braking'
  | 'suspension'
  | 'steering'
  | 'drivetrain'
  | 'interior'
  | 'bodywork'
  | 'electrical'
  | 'other';

export type ConsumableTag =
  | 'エンジンオイル'
  | 'オイルエレメント'
  | 'エアクリーナー'
  | 'スパークプラグ'
  | '冷却水'
  | 'ブレーキフルード'
  | 'バッテリー'
  | 'タイヤ'
  | 'ミッションオイル'
  | 'デフオイル'
  | 'フューエルフィルター';

export interface ClassifiedItem {
  description: string;
  amount: number | null;
  maintenanceCategory: MaintenanceCategory;
  consumableTag?: ConsumableTag;
}

export interface MaintenanceRecord {
  id: string;
  category: string;
  date: string;
  totalAmount: number;
  items: ClassifiedItem[];
  mileage: number | null;
  shop: string;
  source: string;
  tasks: string[];
}

export interface MaintenanceTableRow {
  id: string;
  date: string;
  amount: number;
  consumableTags: ConsumableTag[];
  maintenanceTags: MaintenanceCategory[];
  mileage: number | null;
  shop: string;
}
