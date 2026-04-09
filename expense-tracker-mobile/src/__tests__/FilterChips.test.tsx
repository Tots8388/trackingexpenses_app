import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FilterChips from '../components/FilterChips';
import { ThemeProvider } from '../theme/ThemeContext';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const options = [
  { label: 'All', value: '' },
  { label: 'Income', value: 'income' },
  { label: 'Expenses', value: 'expense' },
];

describe('FilterChips', () => {
  it('renders all options', () => {
    renderWithTheme(<FilterChips options={options} selected="" onSelect={() => {}} />);

    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getByText('Expenses')).toBeTruthy();
  });

  it('calls onSelect with correct value when chip is pressed', () => {
    const onSelect = jest.fn();
    renderWithTheme(<FilterChips options={options} selected="" onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Income'));
    expect(onSelect).toHaveBeenCalledWith('income');
  });

  it('calls onSelect when pressing a different chip', () => {
    const onSelect = jest.fn();
    renderWithTheme(<FilterChips options={options} selected="income" onSelect={onSelect} />);

    fireEvent.press(screen.getByText('Expenses'));
    expect(onSelect).toHaveBeenCalledWith('expense');
  });
});
