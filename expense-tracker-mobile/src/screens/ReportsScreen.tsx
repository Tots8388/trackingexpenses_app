import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../theme/ThemeContext';
import { getTransactions } from '../api/endpoints';
import type { Transaction } from '../api/endpoints';
import StatCard from '../components/StatCard';
import FilterChips from '../components/FilterChips';
import TransactionItem from '../components/TransactionItem';
import LoadingScreen from '../components/LoadingScreen';
import { chartColors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

const rangeOptions = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

export default function ReportsScreen() {
  const { theme } = useTheme();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [range, setRange] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await getTransactions();
      setAllTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingScreen />;

  // Date range filtering (same logic as web Reports.jsx)
  const today = new Date();
  let startDate: Date | null = null;
  if (range === '1m') startDate = new Date(today.getTime() - 30 * 86400000);
  else if (range === '3m') startDate = new Date(today.getTime() - 90 * 86400000);
  else if (range === '6m') startDate = new Date(today.getTime() - 180 * 86400000);
  else if (range === '1y') startDate = new Date(today.getTime() - 365 * 86400000);

  const filtered = startDate
    ? allTransactions.filter(t => new Date(t.date) >= startDate!)
    : allTransactions;

  // Summary
  const amounts = filtered.map(t => Number(t.amount));
  const totalIncome = amounts.filter(a => a > 0).reduce((s, a) => s + a, 0);
  const totalExpense = Math.abs(amounts.filter(a => a < 0).reduce((s, a) => s + a, 0));

  // Monthly breakdown
  const monthlyMap: Record<string, { income: number; expense: number }> = {};
  filtered.forEach(t => {
    const key = t.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 };
    const amt = Number(t.amount);
    if (amt > 0) monthlyMap[key].income += amt;
    else monthlyMap[key].expense += Math.abs(amt);
  });
  const sortedMonths = Object.keys(monthlyMap).sort();
  const barLabels = sortedMonths.map(m => {
    const [y, mo] = m.split('-');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return monthNames[parseInt(mo) - 1];
  });

  // Category breakdown
  const catMap: Record<string, number> = {};
  filtered.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(t.amount));
  });
  const pieData = Object.entries(catMap).map(([name, amount], i) => ({
    name: name.length > 12 ? name.slice(0, 10) + '..' : name,
    amount,
    color: chartColors[i % chartColors.length],
    legendFontColor: theme.textSecondary,
    legendFontSize: 11,
  }));

  // Top expenses
  const topExpenses = filtered
    .filter(t => t.type === 'expense')
    .sort((a, b) => Number(a.amount) - Number(b.amount))
    .slice(0, 10);

  const chartConfig = {
    backgroundColor: theme.bgCard,
    backgroundGradientFrom: theme.bgCard,
    backgroundGradientTo: theme.bgCard,
    decimalCount: 0,
    color: () => theme.primary,
    labelColor: () => theme.textMuted,
    barPercentage: 0.5,
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.bgMain }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Analytics & insights</Text>
      </View>

      <FilterChips options={rangeOptions} selected={range} onSelect={setRange} />

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statHalf}><StatCard label="Income" value={totalIncome} type="income" /></View>
        <View style={styles.statHalf}><StatCard label="Expenses" value={totalExpense} type="expense" /></View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statHalf}><StatCard label="Balance" value={totalIncome - totalExpense} type="balance" /></View>
        <View style={styles.statHalf}><StatCard label="Count" value={filtered.length} /></View>
      </View>

      {/* Monthly Bar Chart */}
      {sortedMonths.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Monthly Overview</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: barLabels,
                datasets: [
                  { data: sortedMonths.map(m => monthlyMap[m].expense) },
                ],
              }}
              width={Math.max(screenWidth - 64, barLabels.length * 60)}
              height={200}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero
            />
          </ScrollView>
        </View>
      )}

      {/* Category Pie */}
      {pieData.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Expenses by Category</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            chartConfig={chartConfig}
          />
        </View>
      )}

      {/* Top Expenses */}
      {topExpenses.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Top Expenses</Text>
          {topExpenses.map(tx => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { paddingTop: 48, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statHalf: { flex: 1 },
  card: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 10,
    marginLeft: -16,
  },
});
