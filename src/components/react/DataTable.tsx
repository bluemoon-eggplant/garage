import React, { useMemo } from 'react';

export interface Column {
  key: string;
  label: string;
  /** Show data bar for numeric values */
  dataBar?: boolean;
  /** Data bar color (default: blue) */
  barColor?: string;
  /** Format function for display */
  format?: (value: any) => string;
  /** Custom React renderer (takes precedence over format/dataBar) */
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
  /** Column width */
  width?: string;
  /** Truncate text with ellipsis (uses width as max-width) */
  truncate?: boolean;
}

export interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  /** Caption for the table */
  caption?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  caption,
}) => {
  // Calculate min/max for data bar columns
  const dataBarRanges = useMemo(() => {
    const ranges: Record<string, { min: number; max: number }> = {};

    columns.forEach((col) => {
      if (col.dataBar) {
        const values = data
          .map((row) => row[col.key])
          .filter((v) => typeof v === 'number') as number[];

        if (values.length > 0) {
          ranges[col.key] = {
            min: Math.min(...values),
            max: Math.max(...values),
          };
        }
      }
    });

    return ranges;
  }, [columns, data]);

  const getBarWidth = (colKey: string, value: number): number => {
    const range = dataBarRanges[colKey];
    if (!range || range.max === range.min) return 100;
    return ((value - range.min) / (range.max - range.min)) * 100;
  };

  const formatValue = (col: Column, value: any): string => {
    if (col.format) return col.format(value);
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value ?? '');
  };

  const totalWidth = columns.reduce((sum, col) => sum + parseInt(col.width || '120', 10), 0);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="overflow-auto max-h-[80vh]">
        <table className="border-collapse text-sm" style={{ tableLayout: 'fixed', width: `${totalWidth}px` }}>
          {caption && (
            <caption className="bg-gray-50 dark:bg-gray-800 px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              {caption}
            </caption>
          )}
          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-100 dark:bg-gray-800">
              {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                    style={{ width: col.width || '120px' }}
                  >
                    {col.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  ${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
                  hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors
                `}
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  const isNumeric = typeof value === 'number';
                  const showDataBar = col.dataBar && isNumeric;
                  const barWidth = showDataBar ? getBarWidth(col.key, value) : 0;
                  const barColor = col.barColor || 'rgb(59, 130, 246)'; // blue-500

                  return (
                    <td
                      key={col.key}
                      className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ width: col.width || '120px' }}
                    >
                      {col.render ? (
                        col.render(value, row)
                      ) : showDataBar ? (
                        <div className="relative">
                          {/* Data bar background */}
                          <div
                            className="absolute inset-y-0 left-0 opacity-25 rounded"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: barColor,
                            }}
                          />
                          {/* Value text */}
                          <span className="relative z-10 font-mono">
                            {formatValue(col, value)}
                          </span>
                        </div>
                      ) : col.truncate ? (
                        <span
                          className={`block overflow-hidden text-ellipsis ${isNumeric ? 'font-mono' : ''}`}
                          style={{ maxWidth: col.width || '120px' }}
                          title={formatValue(col, value)}
                        >
                          {formatValue(col, value)}
                        </span>
                      ) : (
                        <span className={isNumeric ? 'font-mono' : ''}>
                          {formatValue(col, value)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
