import React from 'react';

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`flex items-center p-1 rounded-xl bg-secondary/60 border border-border overflow-x-auto scrollbar-none max-w-full ${className}`}
    >
      <div className="flex items-center gap-1 min-w-full sm:min-w-0">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 sm:flex-initial shrink-0 flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none whitespace-nowrap ${
                isSelected
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
