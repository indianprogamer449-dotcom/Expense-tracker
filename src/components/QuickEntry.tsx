import React, { useState, useMemo } from 'react';
import { Category, Transaction, TransactionType, CategoryType } from '../types';
import { Plus, ArrowDownCircle, ArrowUpCircle, ReceiptText, Trash2 } from 'lucide-react';
import { cn, formatDateForInput } from '../lib/utils';

interface QuickEntryProps {
  categories: Category[];
  onAdd: (transaction: Partial<Transaction>) => void;
  onAddCategory?: (name: string, type: CategoryType) => void;
  onDeleteCategory?: (id: string) => void;
  onUpdateCategory?: (id: string, data: Partial<Category>) => void;
  initialData?: Transaction | null;
  onCancelEdit?: () => void;
  onDelete?: (id: string) => void;
}

export function QuickEntry({ categories, onAdd, onAddCategory, onDeleteCategory, onUpdateCategory, initialData, onCancelEdit, onDelete }: QuickEntryProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => formatDateForInput(new Date()));
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [billStatus, setBillStatus] = useState<'received' | 'pending' | 'not_applicable'>('not_applicable');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<CategoryType>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount.toString());
      setDate(formatDateForInput(new Date(initialData.date)));
      setNotes(initialData.notes || '');
      setType(initialData.type);
      setBillStatus(initialData.billStatus || 'not_applicable');
      setCategoryId(initialData.category);
    } else {
      // Clear form when initialData becomes null
      setAmount('');
      setDate(initialData ? formatDateForInput(new Date(initialData.date)) : formatDateForInput(new Date()));
      setNotes('');
      setType('expense');
      setBillStatus('not_applicable');
    }
  }, [initialData]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      !cat.type || cat.type === 'both' || cat.type === type
    );
  }, [categories, type]);

  const [categoryId, setCategoryId] = useState(filteredCategories[0]?.id || '');

  // Keep categoryId in sync when filtered list changes or type changes (only if NOT editing)
  React.useEffect(() => {
    if (!initialData && !filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [filteredCategories, categoryId, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) return;

    const val = parseFloat(amount);
    const safeAmount = isNaN(val) ? 0 : Math.round(val * 100) / 100;

    onAdd({
      amount: safeAmount,
      category: categoryId,
      date: new Date(date).toISOString(),
      notes: notes,
      type: type,
      billStatus: billStatus
    });
    
    if (!initialData) {
      setAmount('');
      setNotes('');
      setBillStatus('not_applicable');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-500">
      <div className={cn(
        "section-card transition-all duration-500",
        initialData && "ring-2 ring-indigo-500 shadow-xl scale-[1.02]"
      )}>
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
            {initialData ? 'Edit Entry' : 'Quick Entry'}
          </p>
          {initialData && onDelete && (
            <button 
              type="button"
              onClick={() => {
                const id = initialData.id || initialData._id;
                if (id) {
                  onDelete(id);
                  if (onCancelEdit) onCancelEdit();
                }
              }}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete Transaction"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {initialData ? 'Update transaction' : 'Add a transaction'}
        </h2>
        
        <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
          <button 
            type="button"
            onClick={() => setType('expense')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              type === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-slate-400"
            )}
          >
            <ArrowDownCircle className="w-4 h-4" /> Expense
          </button>
          <button 
            type="button"
            onClick={() => setType('income')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              type === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400"
            )}
          >
            <ArrowUpCircle className="w-4 h-4" /> Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Amount</label>
              <input 
                type="number" 
                step="any"
                placeholder="0"
                required
                className="input-base text-base font-semibold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
              {filteredCategories.length > 0 ? (
                <select 
                  className="input-base font-medium"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <div className="input-base text-slate-400 text-xs italic flex items-center justify-center">
                  Add a category below
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Date</label>
            <input 
              type="date" 
              required
              className="input-base font-medium"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Notes</label>
            <input 
              placeholder="Source or description..."
              className="input-base"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <ReceiptText className={cn("w-3 h-3", billStatus === 'received' && "text-emerald-500")} />
              Bill Status (Expenses)
            </label>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(['received', 'pending', 'not_applicable'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setBillStatus(status)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase tracking-widest",
                    billStatus === status
                      ? (status === 'received' ? "bg-emerald-100 text-emerald-700" : status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-white text-slate-700 shadow-sm")
                      : "text-slate-400 hover:text-slate-500"
                  )}
                >
                  {status === 'not_applicable' ? 'N/A' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {initialData && (
              <button 
                type="button" 
                onClick={onCancelEdit}
                className="flex-1 py-4 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm tracking-wide transition-all active:scale-95 hover:bg-slate-300"
              >
                Cancel
              </button>
            )}
            <button type="submit" className={cn(
              "flex-[2] py-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all active:scale-95 shadow-md",
              type === 'income' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-red-600 hover:bg-red-700 shadow-red-500/20",
              initialData && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            )}>
              {initialData ? 'Update Transaction' : `Save ${type}`}
            </button>
          </div>
        </form>
      </div>

      <div className="section-card">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Category Management</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 leading-relaxed">
          Create custom labels for your transactions and assign them to income or expense buckets.
        </p>
        
        <div className="space-y-4 mb-6">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
             {(['expense', 'income', 'both'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    if (editingCategory) {
                      setEditingCategory({ ...editingCategory, type: t });
                    } else {
                      setNewCatType(t);
                    }
                  }}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all uppercase tracking-widest",
                    (editingCategory ? editingCategory.type === t : newCatType === t) ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                  )}
                >
                  {t}
                </button>
             ))}
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={editingCategory ? "New category name..." : "Category name..."}
              className="input-base flex-1"
              value={editingCategory ? editingCategory.name : newCatName}
              onChange={(e) => {
                if (editingCategory) {
                  setEditingCategory({ ...editingCategory, name: e.target.value });
                } else {
                  setNewCatName(e.target.value);
                }
              }}
            />
            <button 
              className={cn(
                "px-4 text-xs font-bold rounded-xl transition-all",
                editingCategory ? "bg-indigo-600 text-white hover:bg-indigo-700" : "btn-emerald-secondary"
              )}
              onClick={() => {
                if (editingCategory && onUpdateCategory) {
                  onUpdateCategory(editingCategory.id, { 
                    name: editingCategory.name, 
                    type: editingCategory.type 
                  });
                  setEditingCategory(null);
                } else if (onAddCategory && newCatName.trim()) {
                  onAddCategory(newCatName, newCatType as any);
                  setNewCatName('');
                }
              }}
            >
              {editingCategory ? 'Update' : 'Add'}
            </button>
            {editingCategory && (
              <button 
                onClick={() => setEditingCategory(null)}
                className="px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all group hover:shadow-sm cursor-pointer",
                  editingCategory?.id === cat.id ? "bg-indigo-50 border-indigo-200 shadow-md ring-1 ring-indigo-200" : "bg-slate-50 border-slate-100 hover:bg-white"
                )}
                onClick={() => setEditingCategory(cat)}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{cat.name}</span>
                
                <span className="flex items-center opacity-30 group-hover:opacity-60 transition-opacity">
                  {cat.type === 'income' && <ArrowUpCircle className="w-2.5 h-2.5 text-emerald-600" />}
                  {cat.type === 'expense' && <ArrowDownCircle className="w-2.5 h-2.5 text-red-600" />}
                  {cat.type === 'both' && <div className="flex -space-x-1"><ArrowUpCircle className="w-2 h-2 text-emerald-600" /><ArrowDownCircle className="w-2 h-2 text-red-600" /></div>}
                </span>

                {onDeleteCategory && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(cat.id);
                    }}
                    className="p-0.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
