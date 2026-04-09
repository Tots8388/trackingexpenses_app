import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import EmptyState from '../components/EmptyState';
import { ThemeProvider } from '../theme/ThemeContext';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('EmptyState', () => {
  it('renders icon, title, and message', () => {
    renderWithTheme(
      <EmptyState icon="📝" title="No transactions" message="Add your first one." />
    );

    expect(screen.getByText('📝')).toBeTruthy();
    expect(screen.getByText('No transactions')).toBeTruthy();
    expect(screen.getByText('Add your first one.')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onAction = jest.fn();
    renderWithTheme(
      <EmptyState icon="📝" title="Empty" message="Nothing here" actionLabel="Add" onAction={onAction} />
    );

    const button = screen.getByText('Add');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when label is missing', () => {
    renderWithTheme(
      <EmptyState icon="📝" title="Empty" message="Nothing here" />
    );

    expect(screen.queryByText('Add')).toBeNull();
  });
});
