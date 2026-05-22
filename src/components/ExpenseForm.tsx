import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { X, Plus, Save, ArrowDownCircle, ArrowUpCircle, Calendar, MessageSquare, Info, ReceiptText, Trash2 } from 'lucide-react';
import { cn, formatDateForInput } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  initialData?: Transaction | null;
}

export function ExpenseForm({ isOpen, onClose, onSubmit, onDelete, categories, initialData }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => formatDateForInput(new Date()));
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [billStatus, setBillStatus] = useState<'received' | 'pending' | 'not_applicable'>('not_applicable');

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      !cat.type || cat.type === 'both' || cat.type === type
    );
  }, [categories, type]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAmount(initialData.amount !== undefined && initialData.amount !== null ? initialData.amount.toString() : '');
        setCategoryId(initialData.category || '');
        setType(initialData.type || 'expense');
        
        if (initialData.date) {
          setDate(formatDateForInput(initialData.date));
        }
        setNotes(initialData.notes || '');
        setBillStatus(initialData.billStatus || 'not_applicable');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && !filteredCategories.find(c => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id || '');
    }
  }, [type, filteredCategories, isOpen, categoryId]);

  const resetForm = () => {
    setAmount('');
    setCategoryId(categories[0]?.id || '');
    setDate(formatDateForInput(new Date()));
    setNotes('');
    setType('expense');
    setBillStatus('not_applicable');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !date) return;
    
    const val = parseFloat(amount);
    const safeAmount = isNaN(val) ? 0 : val;
    
    onSubmit({
      amount: safeAmount,
      category: categoryId,
      date: new Date(date).toISOString(),
      notes: notes,
      type: type,
      billStatus: billStatus,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#141614] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Modal Ambient Glow */}
            <div className={cn(
               "absolute -top-40 -left-40 w-80 h-80 blur-[120px] rounded-full transition-colors duration-1000",
               type === 'income' ? "bg-emerald-500/20" : "bg-red-500/20"
            )} />

            <div className="relative p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {initialData ? 'Update Record' : 'New Transaction'}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                  Financial flow management
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
              {/* Type Selection */}
              <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5">
                <button 
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.2em]",
                    type === 'expense' 
                      ? "bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)] ring-1 ring-red-500/20" 
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <ArrowDownCircle className={cn("w-4 h-4", type === 'expense' && "animate-bounce")} />
                  Expense
                </button>
                <button 
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.2em]",
                    type === 'income' 
                      ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20" 
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <ArrowUpCircle className={cn("w-4 h-4", type === 'income' && "animate-bounce")} />
                  Income
                </button>
              </div>

              {/* Amount Display */}
              <div className="text-center space-y-2">
                 <div className="relative group inline-block">
                    <span className={cn(
                      "absolute -left-10 top-1/2 -translate-y-1/2 text-3xl font-black transition-colors duration-500",
                      type === 'income' ? "text-emerald-500" : "text-red-500"
                    )}>₹</span>
                    <input 
                      type="number"
                      step="any"
                      placeholder="0"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-transparent text-6xl font-black text-white focus:outline-none placeholder:text-white/5 w-64 text-center tracking-tighter"
                      autoFocus
                    />
                 </div>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Entry Amount</p>
              </div>

              {/* Categories Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Info className="w-3 h-3" /> Select Category
                  </label>
                  <span className="text-[10px] font-bold text-slate-700">{filteredCategories.length} Options</span>
                </div>
                <div className="grid grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-2 group relative overflow-hidden",
                        categoryId === cat.id 
                          ? (type === 'income' 
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                              : "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-none")
                          : "border-white/5 bg-black/20 text-slate-600 hover:border-white/10 hover:text-slate-400"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                        categoryId === cat.id ? "bg-white/10" : "bg-black/20"
                      )} style={{ color: categoryId === cat.id ? undefined : cat.color }}>
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: cat.color }} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-center truncate w-full">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                    <MessageSquare className="w-3 h-3" /> Notes
                  </label>
                  <input 
                    type="text"
                    placeholder="Lunch..."
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-slate-700"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Bill Status */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <ReceiptText className={cn("w-3 h-3", billStatus === 'received' && "text-emerald-500")} /> Bill Received Status
                </label>
                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                  {(['received', 'pending', 'not_applicable'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setBillStatus(status)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest",
                        billStatus === status
                          ? (status === 'received' 
                              ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30" 
                              : status === 'pending'
                                ? "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30"
                                : "bg-white/10 text-white ring-1 ring-white/20")
                          : "text-slate-600 hover:text-slate-400"
                      )}
                    >
                      {status === 'not_applicable' ? 'N/A' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-4 pt-4">
                {initialData && onDelete && (
                  <button 
                    type="button"
                    onClick={() => {
                      const id = initialData.id || initialData._id;
                      if (id) {
                        onDelete(id);
                        onClose();
                      }
                    }}
                    className="p-4 rounded-2xl bg-red-950/30 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-5 h-5 group-active:scale-90" />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={cn(
                    "flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]",
                    type === 'income' 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20" 
                      : "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
                  )}
                >
                  {initialData ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {initialData ? 'Sync Changes' : `Log ${type}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
