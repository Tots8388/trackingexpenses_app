import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getSummary, getTransactions } from '../api/endpoints';
import type { Summary, Transaction } from '../api/endpoints';
import StatCard from '../components/StatCard';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import { chartColors } from '../theme/colors';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, txRes] = await Promise.all([
        getSummary(),
        getTransactions(),
      ]);
      setSummary(sumRes.data);
      setTransactions(txRes.data.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) return <LoadingScreen />;

  // Build balance chart from transactions
  let running = 0;
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const balancePoints = sorted.map(tx => {
    running += Number(tx.amount);
    return { x: tx.date, y: running };
  });

  // Category breakdown for pie chart
  const catMap: Record<string, number> = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category_name || 'Uncategorized';
    catMap[cat] = (catMap[cat] || 0) + Math.abs(Number(t.amount));
  });

  const pieData = Object.entries(catMap).map(([name, amount], i) => ({
    name,
    amount,
    color: chartColors[i % chartColors.length],
    legendFontColor: theme.textSecondary,
    legendFontSize: 12,
  }));

  const lineChartData = {
    labels: balancePoints.length <= 6
      ? balancePoints.map(p => p.x.slice(5)) // MM-DD
      : balancePoints.filter((_, i) => i % Math.ceil(balancePoints.length / 6) === 0).map(p => p.x.slice(5)),
    datasets: [{ data: balancePoints.map(p => p.y) }],
  };

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.bgMain }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Dashboard</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your financial overview</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('Transactions', { screen: 'TransactionForm', params: {} })}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stat Cards */}
      {summary && (
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statHalf}><StatCard label="Income" value={summary.total_income} type="income" icon="📈" /></View>
            <View style={styles.statHalf}><StatCard label="Expenses" value={summary.total_expense} type="expense" icon="📉" /></View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statHalf}><StatCard label="Balance" value={summary.balance} type="balance" icon="💰" /></View>
            <View style={styles.statHalf}><StatCard label="Volume" value={summary.total_volume} type="balance" icon="📊" /></View>
          </View>
        </View>
      )}

      {/* Balance Trend Chart */}
      <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Balance Trend</Text>
        {balancePoints.length > 1 ? (
          <LineChart
            data={lineChartData}
            width={screenWidth - 64}
            height={200}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: theme.bgCard,
              backgroundGradientFrom: theme.bgCard,
              backgroundGradientTo: theme.bgCard,
              decimalPlaces: 0,
              color: () => theme.primary,
              labelColor: () => theme.textMuted,
              propsForDots: { r: '4', strokeWidth: '2', stroke: theme.primaryDark },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={[styles.emptyChart, { color: theme.textMuted }]}>Not enough data yet</Text>
        )}
      </View>

      {/* Category Breakdown */}
      <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>By Category</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            chartConfig={{
              color: () => theme.primary,
              labelColor: () => theme.textSecondary,
            }}
          />
        ) : (
          <Text style={[styles.emptyChart, { color: theme.textMuted }]}>No expenses yet</Text>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map(tx => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))
        ) : (
          <EmptyState
            icon="📝"
            title="No transactions yet"
            message="Add your first transaction to get started."
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 48,
  },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: { marginBottom: 16 },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  emptyChart: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
  },
});
