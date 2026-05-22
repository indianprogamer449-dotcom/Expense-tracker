import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { PREDEFINED_CATEGORIES } from './constants';
import { Transaction, Category, TransactionType, CategoryType } from './types';
import { DashboardOverview } from './components/DashboardOverview';
import { TransactionList } from './components/TransactionList';
import { QuickEntry } from './components/QuickEntry';
import { FilterBar } from './components/FilterBar';
import { Insights } from './components/Insights';
import { parseISO, isValid } from 'date-fns';
import { api } from './services/api';
import { ExpenseForm } from './components/ExpenseForm';
import { AlertCircle, Terminal, ExternalLink, ShieldAlert } from 'lucide-react';
import { cn, getSafeDate, formatDateForInput } from './lib/utils';

const processTransactions = (data: any[]): Transaction[] => {
  return (Array.isArray(data) ? data : []).map(t => {
    const amount = (typeof t.amount === 'number' && !isNaN(t.amount)) ? t.amount : 0;
    const id = (t._id || t.id)?.toString() || '';
    return {
      ...t,
      id,
      _id: id,
      amount,
      billStatus: t.billStatus || 'not_applicable'
    };
  });
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(PREDEFINED_CATEGORIES);
  const [budget, setBudget] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'disconnected'>('disconnected');
  const [dbErrorMessage, setDbErrorMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'insights'>('dashboard');
  
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { status, message } = await api.checkStatus();
        
        if (status === 'error') {
          setDbStatus('error');
          setDbErrorMessage(message || 'Check Atlas IP Whitelist');
        } else {
          setDbStatus('connected');
        }

        const [tData, cData, bData] = await Promise.all([
          api.getTransactions(),
          api.getCategories(),
          api.getBudget()
        ]);
        
        setTransactions(processTransactions(tData));
        if (Array.isArray(cData) && cData.length > 0) {
          setCategories(cData);
        }
        setBudget(bData?.amount || 0);
      } catch (err: any) {
        console.error('Failed to fetch data:', err);
        setDbStatus('error');
        setDbErrorMessage(err.message || 'Check Atlas IP Whitelist');
        setTransactions([]); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addTransaction = async (data: Partial<Transaction>) => {
    try {
      const newT = await api.addTransaction(data);
      if (newT) {
        const cleanT = processTransactions([newT])[0];
        setTransactions(prev => [cleanT, ...prev]);
      }
    } catch (err: any) {
      console.error('Failed to add transaction', err);
      alert(err.message || 'Failed to save transaction');
      throw err; 
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    if (window.innerWidth < 1024) {
      setActiveTab('add');
    } else {
      scrollTo('quick-entry');
    }
  };

  const handleFormSubmit = async (data: Partial<Transaction>) => {
    try {
      if (editingTransaction) {
        const id = editingTransaction._id || editingTransaction.id;
        if (!id) throw new Error('No transaction ID');
        const updated = await api.updateTransaction(id, data);
        const cleanUpdated = processTransactions([updated])[0];
        setTransactions(prev => prev.map(t => (t._id === id || t.id === id) ? cleanUpdated : t));
        setEditingTransaction(null);
      } else {
        await addTransaction(data);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to save transaction', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'received' | 'pending' | 'not_applicable') => {
    try {
      const updated = await api.updateTransaction(id, { billStatus: newStatus });
      const cleanUpdated = processTransactions([updated])[0];
      setTransactions(prev => prev.map(t => (t._id === id || t.id === id) ? cleanUpdated : t));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!id) {
      console.warn('Attempted to delete with null/undefined ID');
      return;
    }
    
    try {
      // Optimistic update
      setTransactions(prev => prev.filter(t => t.id !== id && t._id !== id));
      
      await api.deleteTransaction(id);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Failed to delete transaction. Please try again.');
      
      // Revert if failed
      const freshData = await api.getTransactions();
      setTransactions(processTransactions(freshData));
    }
  };

  const updateBudget = async (amount: number) => {
    try {
      await api.updateBudget(amount);
      setBudget(amount);
    } catch (err) {
      alert('Failed to update budget');
    }
  };

  const addCategory = async (name: string, type: CategoryType = 'expense') => {
    if (!name.trim()) return;
    const newCategory: Category = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      icon: 'LayoutGrid',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      type: type
    };
    try {
      const savedCat = await api.addCategory(newCategory);
      setCategories(prev => [...prev, savedCat]);
    } catch (err) {
      // If categories already exist, we might just ignore or show error
      setCategories(prev => [...prev, newCategory]);
    }
  };
  
  const deleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (selectedCategory === id) setSelectedCategory('all');
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      const updated = await api.updateCategory(id, data);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err) {
      alert('Failed to update category');
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    return transactions.filter(t => {
      const catMatch = selectedCategory === 'all' || t.category === selectedCategory;
      const d = getSafeDate(t.date);
      
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      
      const toDate = dateTo ? new Date(dateTo) : null;
      if (toDate) toDate.setHours(23, 59, 59, 999);

      const fromMatch = !fromDate || d >= fromDate;
      const toMatch = !toDate || d <= toDate;
      
      return catMatch && fromMatch && toMatch;
    });
  }, [transactions, selectedCategory, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedCategory('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      alert('No data to export');
      return;
    }

    const dataToExport = transactions.map(t => ({
      Date: getSafeDate(t.date).toLocaleDateString(),
      Type: t.type.toUpperCase(),
      Amount: t.amount,
      Category: categories.find(c => c.id === t.category)?.name || t.category,
      Notes: t.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    const dateStr = formatDateForInput(new Date());
    XLSX.writeFile(workbook, `Finance_Flow_${dateStr}.xlsx`);
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8 min-h-screen pb-32 lg:pb-8">
      {/* Header Section */}
      <header className="section-card !py-4 sm:!py-6 px-4 sm:!px-8 flex items-center justify-between gap-4 sticky top-2 sm:top-4 z-50 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#3d4430] rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">EF</div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">ExpenseFlow</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                dbStatus === 'connected' ? "bg-emerald-500" : (dbStatus === 'error' ? "bg-red-500 animate-pulse" : "bg-slate-300")
              )} />
              <p className={cn(
                "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate",
                dbStatus === 'connected' ? "text-emerald-600" : (dbStatus === 'error' ? "text-red-500" : "text-slate-400")
              )}>
                {dbStatus === 'connected' ? 'Cloud' : (dbStatus === 'error' ? 'Blocked' : 'Local')}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-8">
          <NavLink label="Add Entry" onClick={() => scrollTo('quick-entry')} />
          <NavLink label="Dashboard" onClick={() => scrollTo('dashboard')} />
          <NavLink label="History" onClick={() => setActiveTab('history')} />
          <NavLink label="Insights" onClick={() => setActiveTab('insights')} />
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={handleExport}
            className="p-2 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest shadow-md flex items-center justify-center"
          >
            <LucideIcons.ArrowDownToLine className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Export XL</span>
          </button>
          <div className="px-3 py-2 sm:px-5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl hidden xs:block">
            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Budget</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
              {budget > 0 ? `₹${budget.toLocaleString('en-IN')}` : 'Set'}
            </p>
          </div>
        </div>
      </header>
        {dbStatus === 'error' && (
        <div className="mb-8 p-8 rounded-[2rem] bg-red-50 border border-red-200 shadow-2xl shadow-red-900/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-110">
            <ShieldAlert className="w-48 h-48 text-red-900" />
          </div>
          
          <div className="relative flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-[1.5rem] bg-red-600 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-red-950 tracking-tight">MongoDB Cloud Sync Blocked</h3>
                  <p className="text-sm text-red-800 font-medium leading-relaxed max-w-2xl mt-1">
                    Your Atlas database is rejecting the connection (SSL Alert 80). Because this app runs on a cloud server, you <b>must</b> allow access from all IPs in Atlas.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      (window as any).DISCONNECTED = true;
                      setDbStatus('disconnected'); 
                      localStorage.setItem('OFFLINE_PREFERENCE', 'true');
                    }}
                    className="px-4 py-2 bg-white text-red-900 border border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm shrink-0"
                  >
                    Use Local Only
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm shrink-0"
                  >
                    Retry Sync
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/60 border border-red-100 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-red-900 uppercase tracking-widest">
                    <Terminal className="w-3.5 h-3.5" /> Required Fix (Step-by-Step)
                  </div>
                  <ol className="text-xs text-red-800 space-y-2 font-bold list-decimal ml-4">
                    <li>Log into your <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="underline decoration-red-400">MongoDB Atlas Console</a></li>
                    <li>In the left sidebar, click <b>Network Access</b></li>
                    <li>Click the <b>Add IP Address</b> button</li>
                    <li>Select <span className="bg-red-900 text-white px-2 py-0.5 rounded-md inline-block scale-90">Allow Access From Anywhere</span> (0.0.0.0/0)</li>
                    <li>Click <b>Confirm</b> and wait 2-3 minutes</li>
                  </ol>
                </div>

                <div className="p-5 rounded-2xl bg-white/60 border border-red-100 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-red-900 uppercase tracking-widest">Why is this happening?</p>
                    <p className="text-xs font-semibold text-red-800 leading-snug">
                      Your database is set to "Private". Since the app's server IP changes frequently, you must set the whitelist to <code className="bg-red-100 px-1 font-black">0.0.0.0/0</code> to enable cloud storage.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-red-100/50 rounded-xl border border-red-200">
                    <p className="text-[9px] font-black text-red-900 uppercase mb-1">Server Response</p>
                    <p className="text-[10px] font-mono text-red-700 break-all leading-tight">
                      {dbErrorMessage || 'SSL_TLSV1_ALERT_INTERNAL_ERROR: Connection rejected by MongoDB Atlas.'}
                    </p>
                    <p className="text-[8px] text-red-600 mt-2 font-bold italic">
                      Tip: If you see "SSL Alert 80", it means your whitelist is too restrictive. Use 0.0.0.0/0.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start scroll-mt-24 space-y-8 lg:space-y-0">
        <div 
          id="quick-entry" 
          className={cn(
            "lg:col-span-4 scroll-mt-24",
            activeTab !== 'add' && "max-lg:hidden"
          )}
        >
          <QuickEntry 
            categories={categories} 
            onAdd={(data) => {
              handleFormSubmit(data);
              if (window.innerWidth < 1024) setActiveTab('dashboard');
            }} 
            onAddCategory={addCategory} 
            onDeleteCategory={deleteCategory}
            onUpdateCategory={updateCategory}
            initialData={editingTransaction}
            onCancelEdit={() => {
              setEditingTransaction(null);
              if (window.innerWidth < 1024) setActiveTab('dashboard');
            }}
            onDelete={deleteTransaction}
          />
        </div>
        <div 
          id="dashboard" 
          className={cn(
            "lg:col-span-8 scroll-mt-24 space-y-8",
            activeTab !== 'dashboard' && activeTab !== 'history' && activeTab !== 'insights' && "max-lg:hidden"
          )}
        >
          <div className={cn(activeTab !== 'dashboard' && "max-lg:hidden")}>
            <DashboardOverview transactions={transactions} budget={budget} onUpdateBudget={updateBudget} />
          </div>
          
          <div className={cn(activeTab !== 'insights' && "max-lg:hidden")}>
             <Insights transactions={filteredTransactions} categories={categories} />
          </div>

          <div className={cn(activeTab !== 'history' && "max-lg:hidden")}>
            <div id="filters" className="section-card scroll-mt-24 mb-8">
              <FilterBar 
                categories={categories} 
                selectedCategory={selectedCategory} 
                onCategoryChange={setSelectedCategory}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                onClear={clearFilters}
                count={filteredTransactions.length}
              />
            </div>

            <div id="transactions" className="section-card scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Recent Activity</p>
                  <h2 className="text-2xl font-bold text-slate-900">Latest transactions</h2>
                </div>
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={handleExport}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-emerald-100 transition-all border border-emerald-100"
                  >
                    Export
                  </button>
                </div>
              </div>
              <TransactionList 
                transactions={filteredTransactions} 
                categories={categories} 
                onDelete={deleteTransaction} 
                onEdit={handleEditTransaction}
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Loading Data...</p>
          </div>
        </div>
      )}


      <footer className="py-24 text-center">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">SpendWise Flow v2.1 • Multi-Currency Support • Data stored locally</p>
      </footer>

      {/* Mobile Sticky Nav */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around">
          <MobileNavItem 
            icon={<LucideIcons.LayoutDashboard className="w-5 h-5" />} 
            label="Home" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <MobileNavItem 
            icon={<LucideIcons.History className="w-5 h-5" />} 
            label="History" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
          />
          <button 
            onClick={() => setActiveTab('add')}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center -translate-y-8 shadow-xl transition-all active:scale-90",
              activeTab === 'add' ? "bg-indigo-600 shadow-indigo-200" : "bg-slate-900 shadow-slate-200"
            )}
          >
            <LucideIcons.Plus className="w-6 h-6 text-white" />
          </button>
          <MobileNavItem 
            icon={<LucideIcons.PieChart className="w-5 h-5" />} 
            label="Charts" 
            active={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')} 
          />
          <MobileNavItem 
            icon={<LucideIcons.ArrowDownToLine className="w-5 h-5" />} 
            label="Export" 
            active={false} 
            onClick={handleExport} 
          />
        </div>
      </div>
    </div>
  );
}

import * as LucideIcons from 'lucide-react';

interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function MobileNavItem({ icon, label, active, onClick }: MobileNavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-indigo-600 scale-110" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function NavLink({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-[10px] font-bold uppercase tracking-widest transition-all",
        active ? "text-emerald-700 border-b-2 border-emerald-600" : "text-slate-500 hover:text-emerald-600"
      )}
    >
      {label}
    </button>
  );
}
