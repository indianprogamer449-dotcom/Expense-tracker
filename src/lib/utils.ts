import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: any) {
  let num: number;
  if (typeof amount === 'number') {
    num = amount;
  } else {
    num = parseFloat(amount);
  }
  
  if (isNaN(num) || !isFinite(num)) {
    num = 0;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
}

export function getSafeDate(date: any): Date {
  if (!date) return new Date();
  
  try {
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'string') {
      d = parseISO(date);
    } else {
      d = new Date(date);
    }
    return isValid(d) ? d : new Date();
  } catch (e) {
    return new Date();
  }
}

export function formatDateForInput(date: any): string {
  const d = getSafeDate(date);
  return d.toISOString().split('T')[0];
}
