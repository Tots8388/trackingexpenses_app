import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  category: string;
  spent: number;
  limit: number;
};

export default function BudgetProgressBar({ category, spent, limit }: Props) {
  const { theme } = useTheme();
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over = spent > limit;

  const barColor = pct >= 100 ? theme.accentRed : pct >= 80 ? theme.primary : theme.accentGreen;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.category, { color: theme.textPrimary }]}>{category}</Text>
        <Text style={[styles.amounts, { color: theme.textSecondary }]}>
          ${spent.toFixed(2)} / ${limit.toFixed(2)}
        </Text>
      </View>

      <View style={[styles.barBg, { backgroundColor: theme.bgMain }]}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.pct, { color: barColor }]}>{pct.toFixed(0)}%</Text>
        {over ? (
          <Text style={[styles.status, { color: theme.accentRed }]}>Over budget by ${(spent - limit).toFixed(2)}</Text>
        ) : (
          <Text style={[styles.status, { color: theme.textMuted }]}>${(limit - spent).toFixed(2)} remaining</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
  },
  amounts: {
    fontSize: 13,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pct: {
    fontSize: 12,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
  },
});
