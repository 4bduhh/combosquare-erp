import { formatDate } from '@/lib/date';

interface DateInputProps {
  value: string; // 'YYYY-MM-DD' or ''
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

/**
 * The native <input type="date"> always displays in the browser's locale
 * format (often MM/DD/YYYY), which CSS can't override. This wraps it: the
 * native input stays functional (click anywhere to open the calendar picker)
 * but is invisible, while a DD/MM/YYYY label sits on top for display.
 */
export function DateInput({ value, onChange, required, className = '' }: DateInputProps) {
  return (
    <div
      className={`relative w-full px-4 py-2.5 rounded-xl bg-[#F8F7FC] border border-[#D5D0E5] text-[#1F1B2E] cursor-pointer focus-within:border-[#7653B8] ${className}`}
    >
      <span className="pointer-events-none select-none">
        {value ? formatDate(value) : <span className="text-[#9B95A8]">dd/mm/yyyy</span>}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
}