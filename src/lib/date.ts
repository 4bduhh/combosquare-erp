/**
 * Formats a plain date column ('YYYY-MM-DD', e.g. joining_date, revenue.date,
 * attendance.date) as DD/MM/YYYY. Splits the string directly instead of going
 * through `new Date()` so there's no timezone shifting.
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.slice(0, 10).split('-');
    if (!y || !m || !d) return '—';
    return `${d}/${m}/${y}`;
  }
  
  /**
   * Formats a full timestamp column (e.g. created_at) as DD/MM/YYYY using local time.
   */
  export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }