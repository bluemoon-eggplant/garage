import { format } from 'date-fns';

export const dateFormats = {
  /** 2024-01-13 */
  cardDate: 'yyyy-MM-dd',
  /** 2024-02-26 */
  isoDate: 'yyyy-MM-dd',
  /** Tue, 16th July, 9am */
  shortDate: 'do MMMM, haaa',
} as const;

export const formatDate = (date: Date): string => format(date, dateFormats.cardDate);

export const formatDateIso = (date: Date): string => format(date, dateFormats.isoDate);

export const shortDate = (date: Date): string => format(date, dateFormats.shortDate);
