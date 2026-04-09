import React from 'react';

import DataTable from './DataTable';
import TagBadge from './TagBadge';
import { useTranslations } from '@/i18n';
import { localizedPath } from '@/utils/i18n';

import type { Column } from './DataTable';
import type { ConsumableTag, MaintenanceTableRow } from '@/types/record';

interface RecordDataTableProps {
  data: MaintenanceTableRow[];
  category: string;
  caption?: string;
  locale?: string;
}

const RecordDataTable: React.FC<RecordDataTableProps> = ({
  data,
  category,
  caption,
  locale,
}) => {
  const t = useTranslations(locale);

  const columns: Column[] = [
    {
      key: 'date',
      label: t('record.col.completionDate'),
      width: '110px',
    },
    {
      key: 'amount',
      label: t('record.col.amount'),
      width: '130px',
      dataBar: true,
      barColor: 'rgb(59, 130, 246)',
      render: (value: number, row: Record<string, any>) => (
        <div className="relative">
          <a
            href={localizedPath(locale, `/record/detail/${row.id}`)}
            className="relative z-10 font-mono text-blue-600 dark:text-blue-400 hover:underline"
          >
            {value != null ? `¥${value.toLocaleString()}` : '-'}
          </a>
        </div>
      ),
    },
    {
      key: 'mileage',
      label: t('record.col.mileage'),
      width: '140px',
      dataBar: true,
      barColor: 'rgb(34, 197, 94)',
      format: (v: number | null) => (v != null ? v.toLocaleString() + ' km' : '-'),
    },
    {
      key: 'shop',
      label: t('record.col.shop'),
      width: '150px',
    },
    {
      key: 'consumableTags',
      label: t('maintenance.consumable'),
      width: '220px',
      render: (value: ConsumableTag[]) => (
        <div className="flex flex-wrap">
          {value.map((tag) => (
            <TagBadge key={tag} label={tag} locale={locale} />
          ))}
        </div>
      ),
    },
    {
      key: 'inspectionWork',
      label: t('maintenance.inspection'),
      width: '180px',
      truncate: true,
    },
    {
      key: 'engineWork',
      label: t('maintenance.engine'),
      width: '200px',
      truncate: true,
    },
    {
      key: 'coolingWork',
      label: t('maintenance.cooling'),
      width: '180px',
      truncate: true,
    },
    {
      key: 'brakingWork',
      label: t('maintenance.braking'),
      width: '180px',
      truncate: true,
    },
    {
      key: 'drivetrainWork',
      label: t('maintenance.drivetrain'),
      width: '180px',
      truncate: true,
    },
    {
      key: 'bodyWork',
      label: t('maintenance.body'),
      width: '150px',
      truncate: true,
    },
    {
      key: 'otherWork',
      label: t('maintenance.other'),
      width: '200px',
      truncate: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      frozenColumns={1}
      caption={caption}
    />
  );
};

export default RecordDataTable;
