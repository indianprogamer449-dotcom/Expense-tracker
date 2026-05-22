import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { isSameDay, startOfWeek, endOfWeek, isWithinInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency, cn, getSafeDate } from '../lib/utils';

interface DashboardOverviewProps {
  transactions: Transaction[];
  budget: number;
  onUpdateBudget: (amount: number) => void;
}

export function DashboardOverview({ transactions, budget, onUpdateBudget }: DashboardOverviewProps) {
  const now = new Date();
  const [budgetInput, setBudgetInput] = useState(budget.toString());

  const stats = useMemo(() => {
    if (!Array.isArray(transactions)) return { income: 0, expense: 0, balance: 0 };
    
    const periodTransactions = transactions.filter(t => {
      const d = getSafeDate(t.date);
      return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
    });

    const income = Math.round(periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) * 100) / 100;

    const expense = Math.round(periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) * 100) / 100;

    return { income, expense, balance: Math.round((income - expense) * 100) / 100 };
  }, [transactions]);

  const progress = budget > 0 ? (stats.expense / budget) * 100 : 0;
  const isOverBudget = budget > 0 && stats.expense > budget;

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="section-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Financial Health</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Current Balance</h2>
          </div>
          <div className={cn(
            "text-3xl sm:text-4xl font-black tracking-tighter",
            stats.balance >= 0 ? "text-emerald-700" : "text-red-600"
          )}>
            {formatCurrency(stats.balance)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatTile title="Total Income" amount={stats.income} type="income" />
          <StatTile title="Total Expenses" amount={stats.expense} type="expense" />
        </div>

        <div className="mt-8 sm:mt-12 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Monthly budget tracker</h3>
            {isOverBudget && <span className="bg-red-50 text-red-600 text-[8px] sm:text-[10px] font-black px-3 py-1 rounded-full uppercase">Limit Exceeded</span>}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="number"
              step="any"
              placeholder="Set monthly budget"
              className="input-base flex-1 bg-white"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
            <button 
              className="btn-emerald-primary text-xs whitespace-nowrap w-full sm:w-auto"
              onClick={() => {
                const val = parseFloat(budgetInput);
                onUpdateBudget(!isNaN(val) ? val : 0);
                setBudgetInput('');
              }}
            >
              Update Budget
            </button>
          </div>

          <div className="space-y-3">
             <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", isOverBudget ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-emerald-600')} 
                  style={{ width: `${Math.min(progress, 100)}%` }} 
                />
             </div>
             <div className="flex justify-between items-center font-bold">
                <p className="text-sm text-slate-900">
                  {formatCurrency(stats.expense)} spent of {formatCurrency(budget)}
                </p>
                <p className={cn("text-xs uppercase tracking-wider", isOverBudget ? 'text-red-600' : 'text-slate-400')}>
                  {budget > 0 ? `${Math.round(progress)}%` : 'Not set'}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ title, amount, type }: { title: string, amount: number, type: 'income' | 'expense' }) {
  return (
    <div className={cn(
      "border rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all hover:shadow-lg",
      type === 'income' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-60">
        {title}
      </p>
      <p className={cn(
        "text-2xl sm:text-3xl font-black tracking-tighter",
        type === 'income' ? 'text-emerald-700' : 'text-red-700'
      )}>
        {type === 'expense' && '- '}{formatCurrency(amount)}
      </p>
    </div>
  );
}
