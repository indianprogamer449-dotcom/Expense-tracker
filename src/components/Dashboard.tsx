import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { Category, Transaction } from '../types';
import { PREDEFINED_CATEGORIES } from '../constants';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency, getSafeDate } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardProps {
  expenses: Transaction[];
  categories: Category[];
  budget: number;
}

export function Dashboard({ expenses, categories, budget }: DashboardProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = getSafeDate(e.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });
  }, [expenses, monthStart, monthEnd]);

  const dailyTotal = useMemo(() => {
    return expenses
      .filter(e => isSameDay(getSafeDate(e.date), now))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const weeklyTotal = useMemo(() => {
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    return expenses
      .filter(e => isWithinInterval(getSafeDate(e.date), { start: weekStart, end: weekEnd }))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const monthlyTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses]);

  const categoryData = useMemo(() => {
    const data: { name: string, value: number, color: string }[] = [];
    categories.forEach(cat => {
      const total = currentMonthExpenses
        .filter(e => e.category === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      
      if (total > 0) {
        data.push({ name: cat.name, value: total, color: cat.color });
      }
    });
    return data;
  }, [currentMonthExpenses, categories]);

  const monthlyHistoryData = useMemo(() => {
    // Last 6 months
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const total = expenses
        .filter(e => isWithinInterval(getSafeDate(e.date), { start: mStart, end: mEnd }))
        .reduce((sum, e) => sum + e.amount, 0);
      
      data.push({
        name: format(d, 'MMM'),
        total: total
      });
    }
    return data;
  }, [expenses]);

  const budgetProgress = (monthlyTotal / budget) * 100;
  const isOverBudget = monthlyTotal > budget;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Daily Total" 
          amount={dailyTotal} 
          icon={<Icons.Target className="w-5 h-5 text-blue-500" />} 
        />
        <SummaryCard 
          title="Weekly Total" 
          amount={weeklyTotal} 
          icon={<Icons.CalendarRange className="w-5 h-5 text-purple-500" />} 
        />
        <SummaryCard 
          title="Monthly Total" 
          amount={monthlyTotal} 
          icon={<Icons.CalendarDays className="w-5 h-5 text-emerald-500" />} 
          subtext={budget > 0 ? `Budget: ${formatCurrency(budget)}` : undefined}
          progress={budget > 0 ? Math.min(budgetProgress, 100) : undefined}
          isWarning={isOverBudget}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Expenses by Category">
          {categoryData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              No data for current month
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Trend">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyHistoryData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                   formatter={(value: number) => formatCurrency(value)}
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon, subtext, progress, isWarning }: { 
  title: string, 
  amount: number, 
  icon: React.ReactNode, 
  subtext?: string,
  progress?: number,
  isWarning?: boolean
}) {
  return (
    <div className="glass-panel p-6">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight">{formatCurrency(amount)}</div>
      
      {subtext && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-2">
            <span className={isWarning ? "text-red-400 font-bold" : "text-slate-400"}>
              {isWarning ? "Over budget!" : subtext}
            </span>
            <span className="text-slate-400 font-bold">{Math.round(progress || 0)}%</span>
          </div>
          {progress !== undefined && (
            <div className="w-full bg-black/20 backdrop-blur-sm h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-700 ${isWarning ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="glass-panel p-6">
      <h3 className="text-white font-bold mb-8 uppercase text-xs tracking-[0.2em]">{title}</h3>
      {children}
    </div>
  );
}
