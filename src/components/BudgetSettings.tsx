import React, { useState } from 'react';
import { Budget } from '../types';
import { formatCurrency } from '../lib/utils';
import { Settings, Wallet } from 'lucide-react';

interface BudgetSettingsProps {
  budget: number;
  onUpdate: (amount: number) => void;
}

export function BudgetSettings({ budget, onUpdate }: BudgetSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(budget.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(value);
    onUpdate(!isNaN(val) ? val : 0);
    setIsEditing(false);
  };

  return (
    <div className="bg-white/3 p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <Wallet className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Monthly Budget</p>
          <p className="font-bold text-white tracking-tight">{formatCurrency(budget)}</p>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input 
            autoFocus
            type="number"
            step="1"
            className="w-20 px-2 py-1 bg-black/20 border border-white/10 rounded-lg text-xs outline-none text-white focus:ring-1 focus:ring-indigo-500"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-bold uppercase tracking-tight shadow-lg shadow-indigo-500/30">Set</button>
        </form>
      ) : (
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
