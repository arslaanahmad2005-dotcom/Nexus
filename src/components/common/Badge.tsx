import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'neutral' | 'info' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    brand: 'bg-brand-50 text-brand-800 border-brand-200/80 dark:bg-brand-950/70 dark:text-brand-300 dark:border-brand-800/70',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/70',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/70',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/70',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/70'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
