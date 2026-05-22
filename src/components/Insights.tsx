import React, { useMemo } from 'react';
import { Transaction, Category } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { formatCurrency, getSafeDate } from '../lib/utils';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface InsightsProps {
  transactions: Transaction[];
  categories: Category[];
}

export function Insights({ transactions, categories }: InsightsProps) {
  const expenseData = useMemo(() => {
    if (!Array.isArray(categories) || !Array.isArray(transactions)) return [];
    
    return categories
      .map(cat => {
        const totalValue = transactions
          .filter(t => t.type === 'expense' && t.category === cat.id)
          .reduce((sum, t) => sum + t.amount, 0);
        const value = Math.round(totalValue * 100) / 100;
        return { name: cat.name, value, color: cat.color };
      })
      .filter(d => d.value > 0);
  }, [transactions, categories]);

  const monthlyHistory = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      
      const monthlyEntries = transactions.filter(t => {
        return isWithinInterval(getSafeDate(t.date), { start: mStart, end: mEnd });
      });
      
      const inc = Math.round(monthlyEntries.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      const exp = Math.round(monthlyEntries.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      
      data.push({
        name: format(d, 'MMM'),
        income: inc,
        expense: exp
      });
    }
    return data;
  }, [transactions]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4">
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Insights</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Trends & Breakdown</h2>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium max-w-[320px] md:text-right leading-relaxed">
          Comparing income vs expenses over the last 6 months.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="section-card">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest text-slate-400">Expense Categories</h3>
            <p className="text-xs text-slate-400 font-medium">Where is your money going?</p>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No expense data</p>
              </div>
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="mb-6">
             <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest text-slate-400">Cash Flow</h3>
            <p className="text-xs text-slate-400 font-medium">Monthly comparison of money in vs out.</p>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHistory}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-4">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No activity mapped</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
