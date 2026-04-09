import api from './client';

// --- Types ---

export type Transaction = {
  id: number;
  amount: number;
  category: number | null;
  category_name: string | null;
  type: 'income' | 'expense';
  date: string;
  description: string;
  created_at: string;
};

export type Category = {
  id: number;
  name: string;
};

export type Summary = {
  balance: number;
  total_income: number;
  total_expense: number;
  total_volume: number;
};

export type Budget = {
  id: number;
  category: number;
  category_name: string;
  amount: number;
  month: string;
  spent: number;
};

export type RecurringTransaction = {
  id: number;
  amount: number;
  category: number | null;
  category_name: string | null;
  type: 'income' | 'expense';
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  start_date: string;
  end_date: string | null;
  next_run: string;
  is_active: boolean;
  created_at: string;
};

export type UserInfo = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  notification_prefs: {
    weekly_summary: boolean;
    budget_alerts: boolean;
    large_expense_alert: boolean;
    large_expense_threshold: number;
  };
};

// --- Auth ---

export const login = (username: string, password: string) =>
  api.post<{ access: string; refresh: string }>('/token/', { username, password });

export const register = (username: string, password: string, email: string) =>
  api.post('/register/', { username, password, email });

export const getMe = () => api.get<UserInfo>('/me/');

export const requestPasswordReset = (email: string) =>
  api.post<{ message: string }>('/password-reset/', { email });

export const confirmPasswordReset = (email: string, code: string, new_password: string) =>
  api.post<{ message: string }>('/password-reset/confirm/', { email, code, new_password });

// --- Transactions ---

export const getTransactions = (params?: Record<string, string>) =>
  api.get<Transaction[]>('/transactions/', { params });

export const getTransaction = (id: number) =>
  api.get<Transaction>(`/transactions/${id}/`);

export const createTransaction = (data: Partial<Transaction>) =>
  api.post<Transaction>('/transactions/', data);

export const updateTransaction = (id: number, data: Partial<Transaction>) =>
  api.put<Transaction>(`/transactions/${id}/`, data);

export const deleteTransaction = (id: number) =>
  api.delete(`/transactions/${id}/`);

// --- Categories ---

export const getCategories = () => api.get<Category[]>('/categories/');

// --- Summary ---

export const getSummary = (params?: Record<string, string>) =>
  api.get<Summary>('/summary/', { params });

// --- Budgets ---

export const getBudgets = (params?: Record<string, string>) =>
  api.get<Budget[]>('/budgets/', { params });

export const getBudget = (id: number) =>
  api.get<Budget>(`/budgets/${id}/`);

export const createBudget = (data: Partial<Budget>) =>
  api.post<Budget>('/budgets/', data);

export const updateBudget = (id: number, data: Partial<Budget>) =>
  api.put<Budget>(`/budgets/${id}/`, data);

export const deleteBudget = (id: number) =>
  api.delete(`/budgets/${id}/`);

// --- Recurring ---

export const getRecurring = () =>
  api.get<RecurringTransaction[]>('/recurring/');

export const getRecurringItem = (id: number) =>
  api.get<RecurringTransaction>(`/recurring/${id}/`);

export const createRecurring = (data: Partial<RecurringTransaction>) =>
  api.post<RecurringTransaction>('/recurring/', data);

export const updateRecurring = (id: number, data: Partial<RecurringTransaction>) =>
  api.put<RecurringTransaction>(`/recurring/${id}/`, data);

export const patchRecurring = (id: number, data: Partial<RecurringTransaction>) =>
  api.patch<RecurringTransaction>(`/recurring/${id}/`, data);

export const deleteRecurring = (id: number) =>
  api.delete(`/recurring/${id}/`);
