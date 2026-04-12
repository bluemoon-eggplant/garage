import React, { useState, useCallback } from 'react';

import DataTable from './DataTable';
import TagBadge, { MaintenanceBadge } from './TagBadge';
import RecordDetailModal from './RecordDetailModal';
import { useTranslations } from '@/i18n';

import type { Column } from './DataTable';
import type { ConsumableTag, MaintenanceCategory, MaintenanceRecord, MaintenanceTableRow } from '@/types/record';

interface RecordDataTableProps {
  data: MaintenanceTableRow[];
  records: MaintenanceRecord[];
  category: string;
  caption?: string;
  locale?: string;
  blogSlugMap?: Record<string, string>;
}

const RecordDataTable: React.FC<RecordDataTableProps> = ({
  data,
  records,
  category,
  caption,
  locale,
  blogSlugMap,
}) => {
  const t = useTranslations(locale);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const selectedRecord = selectedRecordId
    ? records.find((r) => r.id === selectedRecordId) ?? null
    : null;

  const selectedIndex = selectedRecord
    ? records.findIndex((r) => r.id === selectedRecordId)
    : -1;

  // Resolve blog URL for selected record
  const blogUrl = selectedRecord && blogSlugMap
    ? blogSlugMap[`${selectedRecord.category}|${selectedRecord.date}`] ?? null
    : null;

  const handleClose = useCallback(() => setSelectedRecordId(null), []);
  const handlePrev = selectedIndex > 0
    ? () => setSelectedRecordId(records[selectedIndex - 1].id)
    : undefined;
  const handleNext = selectedIndex >= 0 && selectedIndex < records.length - 1
    ? () => setSelectedRecordId(records[selectedIndex + 1].id)
    : undefined;

  const columns: Column[] = [
    {
      key: 'date',
      label: t('record.col.completionDate'),
      width: '130px',
    },
    {
      key: 'amount',
      label: t('record.col.amount'),
      width: '130px',
      dataBar: true,
      barColor: 'rgb(59, 130, 246)',
      render: (value: number, row: Record<string, any>) => (
        <div className="relative">
          <button
            onClick={() => setSelectedRecordId(row.id)}
            className="relative z-10 font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {value != null ? `¥${value.toLocaleString()}` : '-'}
          </button>
        </div>
      ),
    },
    {
      key: 'mileage',
      label: t('record.col.mileage'),
      width: '130px',
      dataBar: true,
      barColor: 'rgb(34, 197, 94)',
      format: (v: number | null) => (v != null ? v.toLocaleString() + ' km' : '-'),
    },
    {
      key: 'shop',
      label: t('record.col.shop'),
      width: '210px',
    },
    {
      key: 'consumableTags',
      label: t('maintenance.consumable'),
      width: '240px',
      render: (value: ConsumableTag[]) => (
        <div className="flex flex-wrap">
          {value.map((tag) => (
            <TagBadge key={tag} label={tag} locale={locale} />
          ))}
        </div>
      ),
    },
    {
      key: 'maintenanceTags',
      label: t('record.col.maintenanceContent'),
      width: '260px',
      render: (value: MaintenanceCategory[]) => (
        <div className="flex flex-wrap">
          {value.map((cat) => (
            <MaintenanceBadge key={cat} category={cat} locale={locale} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        caption={caption}
      />
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          locale={locale}
          blogUrl={blogUrl}
        />
      )}
    </>
  );
};

export default RecordDataTable;
