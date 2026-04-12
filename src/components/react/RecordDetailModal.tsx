import React, { useEffect, useRef } from 'react';

import TagBadge, { MaintenanceBadge } from './TagBadge';
import { useTranslations } from '@/i18n';
import { MAINTENANCE_CATEGORIES, MAINTENANCE_CATEGORY_EN } from '@/constants/record';

import type { MaintenanceRecord, MaintenanceCategory } from '@/types/record';

interface RecordDetailModalProps {
  record: MaintenanceRecord;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  locale?: string;
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onPrev,
  onNext,
  locale,
}) => {
  const t = useTranslations(locale);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // Keyboard: Escape closes, Left/Right arrows navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext]);

  const displayDate = record.date.replaceAll('/', '-');

  // Group items by maintenance category
  const grouped = new Map<MaintenanceCategory, typeof record.items>();
  for (const item of record.items) {
    const cat = item.maintenanceCategory;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const getCategoryLabel = (cat: MaintenanceCategory): string => {
    return locale === 'en' ? MAINTENANCE_CATEGORY_EN[cat] : MAINTENANCE_CATEGORIES[cat];
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto w-[90vw] max-w-3xl max-h-[85vh] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 backdrop:bg-black/50 overflow-hidden"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('record.detail.invoice')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{displayDate}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none p-1"
            aria-label={t('record.detail.close')}
          >
            &times;
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-auto flex-1 px-6 py-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('record.detail.completionDate')}</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">{displayDate}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('record.detail.shop')}</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">{record.shop}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('record.detail.mileage')}</span>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {record.mileage != null ? `${record.mileage.toLocaleString()} km` : '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('record.detail.totalAmount')}</span>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {record.totalAmount != null ? `¥${record.totalAmount.toLocaleString()}` : '不明'}
              </p>
            </div>
          </div>

          {/* Tasks */}
          {record.tasks.length > 0 && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 px-6 py-4 mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                {t('record.detail.diyTasks')}
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {record.tasks.map((task, i) => (
                  <li key={i}>{task}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Items table */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    {t('record.detail.classification')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">
                    {t('record.detail.workContent')}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                    {t('record.detail.amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...grouped.entries()].map(([cat, items]) =>
                  items.map((item, i) => (
                    <tr
                      key={`${cat}-${i}`}
                      className={`${i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} border-b border-gray-100 dark:border-gray-800`}
                    >
                      {i === 0 && (
                        <td
                          className="px-4 py-3 align-top font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
                          rowSpan={items.length}
                        >
                          <MaintenanceBadge category={cat} locale={locale} />
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {item.description}
                        {item.consumableTag && (
                          <TagBadge label={item.consumableTag} locale={locale} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {item.amount != null ? `¥${item.amount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
                  <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                    {t('record.detail.total')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-lg text-gray-900 dark:text-gray-100">
                    {record.totalAmount != null ? `¥${record.totalAmount.toLocaleString()}` : '不明'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer with prev/next */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          {onPrev ? (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← {t('record.detail.prevRecord')}
            </button>
          ) : <span />}
          {onNext ? (
            <button
              onClick={onNext}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('record.detail.nextRecord')} →
            </button>
          ) : <span />}
        </div>
      </div>
    </dialog>
  );
};

export default RecordDetailModal;
