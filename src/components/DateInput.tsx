import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateInputProps {
  value: string; // stored as ISO 'yyyy-mm-dd', or '' when empty
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

function toISO(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function parseISO(value: string): Date | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function formatDisplay(value: string): string {
  const d = parseISO(value);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DateInput({ value, onChange, required, className = '' }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [viewDate, setViewDate] = useState<Date>(selected ?? new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setViewDate(selected);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const changeMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

  const selectDay = (d: number) => {
    onChange(toISO(year, month, d));
    setOpen(false);
  };

  const goToday = () => {
    const t = new Date();
    onChange(toISO(t.getFullYear(), t.getMonth(), t.getDate()));
    setViewDate(t);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const isSelected = (d: number) =>
    !!selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;

  const isToday = (d: number) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#F8F7FC] border border-[#E8E5F0] text-left text-sm hover:border-[#C4B5FD] transition-all focus:outline-none focus:ring-2 focus:ring-[#7653B8]/30"
      >
        <span className={value ? 'text-[#1F1B2E]' : 'text-[#9B95A8]'}>
          {value ? formatDisplay(value) : 'dd/mm/yyyy'}
        </span>
        <Calendar size={16} className="text-[#9B95A8] shrink-0" />
      </button>

      {/* Invisible field so native HTML "required" validation still works on the surrounding <form> */}
      {required && (
        <input
          type="text"
          value={value}
          required
          readOnly
          tabIndex={-1}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E8E5F0] p-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-[#F0EEF8] text-[#6B6580]">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-[#1F1B2E]">{MONTHS[month]} {year}</span>
            <button type="button" onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-[#F0EEF8] text-[#6B6580]">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] font-medium text-[#9B95A8] py-1">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <div key={i}>
                {d !== null ? (
                  <button
                    type="button"
                    onClick={() => selectDay(d)}
                    className={`w-full aspect-square rounded-lg text-sm transition-all ${
                      isSelected(d)
                        ? 'bg-[#7653B8] text-white font-semibold'
                        : isToday(d)
                        ? 'bg-[#F0EEF8] text-[#7653B8] font-semibold'
                        : 'text-[#1F1B2E] hover:bg-[#F0EEF8]'
                    }`}
                  >
                    {d}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0EEF8]">
            <button
              type="button"
              onClick={goToday}
              className="flex-1 text-center text-xs font-semibold text-[#7653B8] hover:bg-[#F0EEF8] rounded-lg py-2 transition-all"
            >
              Today
            </button>
            {!required && (
              <button
                type="button"
                onClick={clear}
                className="flex-1 text-center text-xs font-semibold text-[#9B95A8] hover:bg-[#F0EEF8] rounded-lg py-2 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}