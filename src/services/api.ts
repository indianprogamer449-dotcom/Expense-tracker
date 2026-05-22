import { Transaction, Category } from '../types';

const API_BASE = '/api';

// Helper to check if we should use local storage
const isOffline = () => {
  return window.location.search.includes('mock=true') || 
         (window as any).DISCONNECTED === true || 
         localStorage.getItem('OFFLINE_PREFERENCE') === 'true';
};

// Fallback handlers
const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const api = {
  checkStatus: async (): Promise<{ status: string; message: string }> => {
    if (localStorage.getItem('OFFLINE_PREFERENCE') === 'true') {
        (window as any).DISCONNECTED = true;
        return { status: 'offline', message: 'Local Mode Active' };
    }
    try {
      const res = await fetch(`${API_BASE}/status`);
      const data = await res.json();
      if (data.status === 'error') {
        (window as any).DISCONNECTED = true;
      } else {
        (window as any).DISCONNECTED = false;
      }
      return data;
    } catch (e) {
      (window as any).DISCONNECTED = true;
      return { status: 'error', message: 'Offline' };
    }
  },
  getTransactions: async (): Promise<Transaction[]> => {
    if (isOffline()) {
      return getLocal('transactions');
    }
    try {
      const res = await fetch(`${API_BASE}/transactions`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return getLocal('transactions');
    }
  },
  addTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
    if (isOffline()) {
      const newT = { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() } as Transaction;
      const all = getLocal('transactions');
      setLocal('transactions', [newT, ...all]);
      return newT;
    }
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.details || errorData.error || 'Failed to save transaction');
    }
    return res.json();
  },
  deleteTransaction: async (id: string): Promise<void> => {
    if (isOffline()) {
      const all = getLocal('transactions');
      setLocal('transactions', all.filter((t: any) => (t.id || t._id) !== id));
      return;
    }
    const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },
  updateTransaction: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    if (isOffline()) {
      const all = getLocal('transactions');
      const updated = all.map((t: any) => (t.id === id || t._id === id) ? { ...t, ...data } : t);
      setLocal('transactions', updated);
      return (updated.find((t: any) => (t.id === id || t._id === id))) as Transaction;
    }
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.details || errorData.error || 'Failed to update transaction');
    }
    return res.json();
  },
  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : [];
    } catch (e) {
      return [];
    }
  },
  addCategory: async (data: Category): Promise<Category> => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteCategory: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
  },
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },
  getBudget: async (): Promise<{ amount: number }> => {
    if (isOffline()) {
      return { amount: Number(localStorage.getItem('budget') || 0) };
    }
    try {
      const res = await fetch(`${API_BASE}/budget`);
      return res.json();
    } catch (e) {
      return { amount: Number(localStorage.getItem('budget') || 0) };
    }
  },
  updateBudget: async (amount: number): Promise<void> => {
    if (isOffline()) {
      localStorage.setItem('budget', amount.toString());
      return;
    }
    await fetch(`${API_BASE}/budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
  },
};
