import React, { useState } from 'react';
import { Category } from '../types';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (category: Category) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export function CategoryManager({ categories, onAdd, onDelete }: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onAdd({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      color,
      icon: 'LayoutGrid'
    });
    setName('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Categories</span>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <input 
             type="text" 
             placeholder="Category name..."
             className="w-full px-3 py-2 text-xs bg-black/20 border border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-slate-600"
             value={name}
             onChange={(e) => setName(e.target.value)}
             autoFocus
          />
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 border border-white/5"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
          <button 
            type="submit"
            className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
          >
            Create Category
          </button>
        </form>
      )}

      <div className="space-y-1.5">
        {categories.map(cat => (
          <div key={cat.id} className="group flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-400 rounded-xl hover:bg-white/5 transition-all cursor-default uppercase tracking-wider">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: cat.color, color: cat.color }} />
              <span>{cat.name}</span>
            </div>
            {!['food', 'travel', 'bills', 'shopping', 'entertainment', 'health', 'other'].includes(cat.id) && (
              <button 
                onClick={() => onDelete(cat.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
