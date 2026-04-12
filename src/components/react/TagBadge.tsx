import React from 'react';

import { CONSUMABLE_TAG_EN, MAINTENANCE_TAG_COLORS, MAINTENANCE_CATEGORY_EN, MAINTENANCE_CATEGORIES } from '@/constants/record';

import type { ConsumableTag, MaintenanceCategory } from '@/types/record';

const TAG_COLORS: Record<ConsumableTag, string> = {
  'エンジンオイル': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  'オイルエレメント': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  'エアクリーナー': 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200',
  'スパークプラグ': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  '冷却水': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200',
  'ブレーキフルード': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  'バッテリー': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  'タイヤ': 'bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200',
  'ミッションオイル': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  'デフオイル': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200',
  'フューエルフィルター': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
};

const FALLBACK_COLOR = 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';

interface TagBadgeProps {
  label: string;
  locale?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({ label, locale }) => {
  const colorClass = TAG_COLORS[label as ConsumableTag] ?? FALLBACK_COLOR;
  const displayLabel = locale === 'en'
    ? (CONSUMABLE_TAG_EN[label as ConsumableTag] ?? label)
    : label;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass} mr-1 mb-0.5`}>
      {displayLabel}
    </span>
  );
};

interface MaintenanceBadgeProps {
  category: MaintenanceCategory;
  locale?: string;
}

export const MaintenanceBadge: React.FC<MaintenanceBadgeProps> = ({ category, locale }) => {
  const colorClass = MAINTENANCE_TAG_COLORS[category];
  const displayLabel = locale === 'en'
    ? MAINTENANCE_CATEGORY_EN[category]
    : MAINTENANCE_CATEGORIES[category];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass} mr-1 mb-0.5`}>
      {displayLabel}
    </span>
  );
};

export default TagBadge;
