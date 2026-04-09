import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getBudgets, deleteBudget } from '../api/endpoints';
import type { Budget } from '../api/endpoints';
import BudgetProgressBar from '../components/BudgetProgressBar';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import type { BudgetStackParamList } from '../navigation/MainTabs';

type Nav = NativeStackNavigationProp<BudgetStackParamList, 'BudgetList'>;

export default function BudgetsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await getBudgets({ month });
      setBudgets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const handleDelete = (id: number) => {
    Alert.alert('Delete Budget', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(id);
            setBudgets(prev => prev.filter(b => b.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete budget.');
          }
        },
      },
    ]);
  };

  // Month navigation
  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setLoading(true);
  };

  const monthDisplay = (() => {
    const [y, m] = month.split('-').map(Number);
    const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${names[m - 1]} ${y}`;
  })();

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.flex, { backgroundColor: theme.bgMain }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Budgets</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Track your spending limits</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('BudgetForm', {})}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Month Picker */}
      <View style={[styles.monthPicker, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: theme.textPrimary }]}>{monthDisplay}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.budgetCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <BudgetProgressBar
              category={item.category_name}
              spent={item.spent}
              limit={Number(item.amount)}
            />
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => navigation.navigate('BudgetForm', { id: item.id })}>
                <Ionicons name="pencil" size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 16 }}>
                <Ionicons name="trash-outline" size={18} color={theme.accentRed} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={budgets.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="💼"
            title="No budgets this month"
            message="Set spending limits for your categories."
            actionLabel="+ Add Budget"
            onAction={() => navigation.navigate('BudgetForm', {})}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  monthText: { fontSize: 16, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  budgetCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
