
export type CategoryType = 'income' | 'expense' | 'both';

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  type?: CategoryType;
};

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  _id?: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  type: TransactionType;
  billStatus: 'received' | 'pending' | 'not_applicable';
  createdAt: string;
};

export type Budget = {
  amount: number;
  month: string;
};
