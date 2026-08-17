import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
      <div className="mb-5 p-5 rounded-2xl bg-[#F0EEF8] border border-[#E8E5F0] animate-float">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#1F1B2E] mb-2">{title}</h3>
      <p className="text-[#6B6580] max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
