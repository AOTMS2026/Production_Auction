import React from 'react';

export interface MoneyInputProps {
  value: number;
  min?: number;
  currency?: string;
  onChange: (val: number) => void;
  quickIncrements?: number[];
  disabled?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  min = 0,
  currency = '$',
  onChange,
  quickIncrements = [100, 500, 1000],
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 font-medium text-sm select-none">
          {currency}
        </span>
        <input
          type="number"
          min={min}
          value={value || ''}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all font-mono"
          placeholder="0.00"
        />
      </div>

      {quickIncrements && quickIncrements.length > 0 && (
        <div className="flex items-center gap-1.5">
          {quickIncrements.map((increment) => (
            <button
              key={increment}
              type="button"
              disabled={disabled}
              onClick={() => onChange((value || min) + increment)}
              className="flex-1 py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 border border-slate-700/50 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
            >
              +{currency}{increment.toLocaleString()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
