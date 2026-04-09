import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StatCard from '../components/StatCard';
import { ThemeProvider } from '../theme/ThemeContext';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('StatCard', () => {
  it('renders label and formatted value', () => {
    renderWithTheme(<StatCard label="Income" value={1250.5} type="income" />);

    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getByText('$1250.50')).toBeTruthy();
  });

  it('renders icon when provided', () => {
    renderWithTheme(<StatCard label="Balance" value={500} type="balance" icon="💰" />);

    expect(screen.getByText('💰')).toBeTruthy();
  });

  it('displays absolute value for negative amounts', () => {
    renderWithTheme(<StatCard label="Expenses" value={-340.99} type="expense" />);

    expect(screen.getByText('$340.99')).toBeTruthy();
  });

  it('renders zero correctly', () => {
    renderWithTheme(<StatCard label="Balance" value={0} type="balance" />);

    expect(screen.getByText('$0.00')).toBeTruthy();
  });
});
