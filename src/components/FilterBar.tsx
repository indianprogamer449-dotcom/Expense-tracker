import React from 'react';
import { Category } from '../types';

interface FilterBarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  onClear: () => void;
  count: number;
}

export function FilterBar({ 
  categories, 
  selectedCategory, 
  onCategoryChange, 
  dateFrom, 
  onDateFromChange, 
  dateTo, 
  onDateToChange,
  onClear,
  count
}: FilterBarProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Filters</p>
          <h2 className="text-2xl font-bold text-slate-900">Slice the data your way</h2>
        </div>
        <p className="text-xs text-slate-400 font-medium max-w-[240px] md:text-right leading-relaxed">
          Use category and date filters to focus the list and charts.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-end gap-3 sm:gap-6">
        <div className="space-y-2 w-full sm:flex-1 sm:min-w-[180px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
          <select 
            className="input-base font-medium"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full sm:flex-[2] sm:min-w-[300px]">
          <div className="space-y-2 flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">From</label>
            <input 
              type="date" 
              className="input-base font-medium"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
          </div>

          <div className="space-y-2 flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">To</label>
            <input 
              type="date" 
              className="input-base font-medium"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={onClear}
          className="w-full sm:w-auto px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all sm:mb-0.5 shadow-sm"
        >
          Clear filters
        </button>
      </div>

      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        Showing {count} of {count} expenses
      </p>
    </div>
  );
}
