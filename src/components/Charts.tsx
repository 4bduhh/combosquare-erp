interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}

export function BarChart({ data, height = 220 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <span className="text-xs font-semibold text-[#6B6580]">
              {d.value > 0 ? d.value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : ''}
            </span>
            <div className="w-full rounded-t-lg relative overflow-hidden group" style={{ height: `${h}%`, minHeight: d.value > 0 ? '4px' : '0' }}>
              <div
                className="w-full h-full rounded-t-lg transition-all duration-1000 ease-out"
                style={{
                  background: d.color ?? 'linear-gradient(180deg, #C4B5FD 0%, #7653B8 100%)',
                }}
              />
            </div>
            <span className="text-xs text-[#9B95A8] truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F0EEF8"
            strokeWidth="16"
          />
          {total > 0 && data.map((d, i) => {
            const len = (d.value / total) * circumference;
            const seg = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease-out' }}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#1F1B2E]">
            {total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-[#6B6580]">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
            <span className="text-sm text-[#6B6580]">{d.label}</span>
            <span className="text-sm font-semibold text-[#1F1B2E] ml-auto">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  label?: string;
}

export function ProgressRing({ value, max, size = 120, label }: ProgressRingProps) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0EEF8"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#7653B8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#1F1B2E]">
          {Math.round(pct * 100)}%
        </span>
        {label && <span className="text-xs text-[#6B6580]">{label}</span>}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max, label, showValue = true }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5">
          {label && <span className="text-sm text-[#6B6580]">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-[#1F1B2E]">
              {value.toLocaleString('en-US', { maximumFractionDigits: 0 })} / {max.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      )}
      <div className="h-2.5 rounded-full bg-[#F0EEF8] overflow-hidden">
        <div
          className="h-full rounded-full progress-fill"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #C4B5FD 0%, #7653B8 100%)',
          }}
        />
      </div>
    </div>
  );
}
