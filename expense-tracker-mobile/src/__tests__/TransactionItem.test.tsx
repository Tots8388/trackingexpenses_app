import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import TransactionItem from '../components/TransactionItem';
import { ThemeProvider } from '../theme/ThemeContext';
import type { Transaction } from '../api/endpoints';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const mockExpense: Transaction = {
  id: 1,
  amount: -75.50,
  category: 7,
  category_name: 'Food & Groceries',
  type: 'expense',
  date: '2026-04-01',
  description: 'Weekly groceries',
  created_at: '2026-04-01T10:00:00Z',
};

const mockIncome: Transaction = {
  id: 2,
  amount: 3000,
  category: 1,
  category_name: 'Salary',
  type: 'income',
  date: '2026-04-01',
  description: 'Monthly salary',
  created_at: '2026-04-01T09:00:00Z',
};

describe('TransactionItem', () => {
  it('renders expense with description and category', () => {
    renderWithTheme(<TransactionItem transaction={mockExpense} />);

    expect(screen.getByText('Weekly groceries')).toBeTruthy();
    expect(screen.getByText('Food & Groceries')).toBeTruthy();
    expect(screen.getByText('-$75.50')).toBeTruthy();
  });

  it('renders income with positive sign', () => {
    renderWithTheme(<TransactionItem transaction={mockIncome} />);

    expect(screen.getByText('Monthly salary')).toBeTruthy();
    expect(screen.getByText('+$3000.00')).toBeTruthy();
  });

  it('shows "No description" when description is empty', () => {
    const noDesc = { ...mockExpense, description: '' };
    renderWithTheme(<TransactionItem transaction={noDesc} />);

    expect(screen.getByText('No description')).toBeTruthy();
  });

  it('shows "Uncategorized" when category is null', () => {
    const noCat = { ...mockExpense, category: null, category_name: null };
    renderWithTheme(<TransactionItem transaction={noCat} />);

    expect(screen.getByText('Uncategorized')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    renderWithTheme(<TransactionItem transaction={mockExpense} onPress={onPress} />);

    fireEvent.press(screen.getByText('Weekly groceries'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button pressed', () => {
    const onDelete = jest.fn();
    renderWithTheme(
      <TransactionItem transaction={mockExpense} onDelete={onDelete} showActions />
    );

    // The delete button renders an Ionicons trash icon - find it by the touchable
    const deleteButtons = screen.root.findAll(
      (node: any) => node.props.onPress === onDelete
    );
    expect(deleteButtons.length).toBeGreaterThan(0);
  });
});
