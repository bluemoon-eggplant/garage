import React from 'react';

import DataTable from './DataTable';
import TagBadge from './TagBadge';

import type { Column } from './DataTable';
import type { ConsumableTag, MaintenanceTableRow } from '@/types/record';

interface RecordDataTableProps {
  data: MaintenanceTableRow[];
  category: string;
  caption?: string;
}

const RecordDataTable: React.FC<RecordDataTableProps> = ({
  data,
  category,
  caption,
}) => {
  const columns: Column[] = [
    {
      key: 'date',
      label: '完了日',
      width: '110px',
    },
    {
      key: 'amount',
      label: '金額',
      width: '130px',
      dataBar: true,
      barColor: 'rgb(59, 130, 246)',
      render: (value: number, row: Record<string, any>) => (
        <div className="relative">
          <a
            href={`/record/detail/${row.id}`}
            className="relative z-10 font-mono text-blue-600 dark:text-blue-400 hover:underline"
          >
            ¥{value.toLocaleString()}
          </a>
        </div>
      ),
    },
    {
      key: 'mileage',
      label: '走行距離 (km)',
      width: '140px',
      dataBar: true,
      barColor: 'rgb(34, 197, 94)',
      format: (v: number | null) => (v != null ? v.toLocaleString() + ' km' : '-'),
    },
    {
      key: 'shop',
      label: '整備店',
      width: '150px',
    },
    {
      key: 'consumableTags',
      label: '主要消耗品交換',
      width: '220px',
      render: (value: ConsumableTag[]) => (
        <div className="flex flex-wrap">
          {value.map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
      ),
    },
    {
      key: 'inspectionWork',
      label: '定期点検',
      width: '180px',
      truncate: true,
    },
    {
      key: 'engineWork',
      label: '機関整備',
      width: '200px',
      truncate: true,
    },
    {
      key: 'coolingWork',
      label: '冷却系整備',
      width: '180px',
      truncate: true,
    },
    {
      key: 'brakingWork',
      label: '制動系整備',
      width: '180px',
      truncate: true,
    },
    {
      key: 'drivetrainWork',
      label: '足回り・駆動系',
      width: '180px',
      truncate: true,
    },
    {
      key: 'bodyWork',
      label: '内外装・板金',
      width: '150px',
      truncate: true,
    },
    {
      key: 'otherWork',
      label: 'その他整備',
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
