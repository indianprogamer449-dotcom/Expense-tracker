import React from 'react';
import { Transaction, Category } from '../types';
import { format, parseISO } from 'date-fns';
import { formatCurrency, cn, getSafeDate } from '../lib/utils';
import * as LucideIcons from 'lucide-react';
import { Trash2, ReceiptText, ArrowDownCircle, ArrowUpCircle, Edit2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onStatusChange?: (id: string, newStatus: 'received' | 'pending' | 'not_applicable') => void;
}

interface TransactionItemProps {
  key?: string | number;
  transaction: Transaction;
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit?: (t: Transaction) => void;
  onStatusChange?: (id: string, newStatus: 'received' | 'pending' | 'not_applicable') => void;
}

function TransactionItem({ 
  transaction: t, 
  categories, 
  onDelete, 
  onEdit, 
  onStatusChange 
}: TransactionItemProps) {
  const category = categories.find(c => c.id === t.category);
  const IconNames = LucideIcons as any;
  const Icon = IconNames[category?.icon || 'LayoutGrid'] || IconNames.LayoutGrid;
  const transactionId = t.id || t._id || '';

  return (
    <div className="bg-slate-50/50 border border-slate-100 rounded-[1.25rem] sm:rounded-3xl p-3 sm:p-6 group transition-all hover:bg-white hover:shadow-md">
      <div className="flex items-center gap-3 sm:gap-6">
        <div 
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110" 
          style={{ backgroundColor: `${category?.color}15`, color: category?.color }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                 {t.type === 'income' ? <ArrowUpCircle className="w-3 h-3 text-emerald-500 shrink-0" /> : <ArrowDownCircle className="w-3 h-3 text-red-500 shrink-0" />}
                 <p className="font-bold text-slate-900 truncate text-sm sm:text-base">
                  {t.notes || category?.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {format(getSafeDate(t.date), 'MMM dd')} • {category?.name}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const statuses: ('received' | 'pending' | 'not_applicable')[] = ['received', 'pending', 'not_applicable'];
                    const currentIndex = statuses.indexOf(t.billStatus || 'not_applicable');
                    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                    if (onStatusChange && transactionId) {
                      onStatusChange(transactionId, nextStatus);
                    }
                  }}
                  className="transition-transform active:scale-95"
                >
                  {t.billStatus === 'received' && (
                    <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                      <ReceiptText className="w-2 h-2" /> Received
                    </span>
                  )}
                  {t.billStatus === 'pending' && (
                    <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                      <ReceiptText className="w-2 h-2" /> Pending
                    </span>
                  )}
                  {(t.billStatus === 'not_applicable' || !t.billStatus) && (
                    <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                      <ReceiptText className="w-2 h-2" /> No Bill
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 shrink-0 text-right">
              <p className={cn(
                "text-base sm:text-xl font-black tracking-tighter",
                t.type === 'income' ? "text-emerald-700" : "text-red-700"
              )}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {onEdit && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(t);
                    }}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-500 hover:bg-white rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
                <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     if (transactionId) onDelete(transactionId);
                   }}
                   className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransactionList({ transactions, categories, onDelete, onEdit, onStatusChange }: TransactionListProps) {
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <div className="space-y-4">
      {safeTransactions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {safeTransactions.map((t, index) => (
            <TransactionItem 
              key={t.id || t._id || `idx-${index}`}
              transaction={t}
              categories={categories}
              onDelete={onDelete}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem]">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <ReceiptText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No results matching your filters.</h3>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Try adjusting your filters or start adding transactions.</p>
        </div>
      )}
    </div>
  );
}
