import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#4B2A87]">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-[#F8F7FC] border border-[#D5D0E5] text-[#1F1B2E] placeholder-[#9B95A8] outline-none transition-all focus:border-[#7653B8] focus:bg-white focus:ring-2 focus:ring-[#7653B8]/20';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputClass} appearance-none cursor-pointer ${props.className ?? ''}`}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  const base = 'px-5 py-2.5 rounded-xl font-semibold transition-all btn-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-peach-gradient text-white hover:shadow-lg',
    ghost: 'bg-[#F8F7FC] text-[#4B2A87] border border-[#D5D0E5] hover:bg-[#EDE9F8]',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  };
  return (
    <button {...rest} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
