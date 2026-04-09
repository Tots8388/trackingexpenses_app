import React from 'react';
import { render, screen } from '@testing-library/react-native';
import BudgetProgressBar from '../components/BudgetProgressBar';
import { ThemeProvider } from '../theme/ThemeContext';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('BudgetProgressBar', () => {
  it('renders category name and amounts', () => {
    renderWithTheme(<BudgetProgressBar category="Food" spent={150} limit={500} />);

    expect(screen.getByText('Food')).toBeTruthy();
    expect(screen.getByText('$150.00 / $500.00')).toBeTruthy();
  });

  it('shows percentage', () => {
    renderWithTheme(<BudgetProgressBar category="Rent" spent={800} limit={1000} />);

    expect(screen.getByText('80%')).toBeTruthy();
  });

  it('shows remaining amount when under budget', () => {
    renderWithTheme(<BudgetProgressBar category="Transport" spent={30} limit={100} />);

    expect(screen.getByText('$70.00 remaining')).toBeTruthy();
  });

  it('shows over budget message when exceeded', () => {
    renderWithTheme(<BudgetProgressBar category="Food" spent={600} limit={500} />);

    expect(screen.getByText('Over budget by $100.00')).toBeTruthy();
  });

  it('caps percentage display at 100', () => {
    renderWithTheme(<BudgetProgressBar category="Food" spent={750} limit={500} />);

    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('handles zero limit gracefully', () => {
    renderWithTheme(<BudgetProgressBar category="Other" spent={50} limit={0} />);

    expect(screen.getByText('0%')).toBeTruthy();
  });
});
