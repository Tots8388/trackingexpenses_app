import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getTransactions, getCategories, deleteTransaction } from '../api/endpoints';
import type { Transaction, Category } from '../api/endpoints';
import TransactionItem from '../components/TransactionItem';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import type { TransactionStackParamList } from '../navigation/MainTabs';

type Nav = NativeStackNavigationProp<TransactionStackParamList, 'TransactionList'>;

const typeFilters = [
  { label: 'All', value: '' },
  { label: 'Income', value: 'income' },
  { label: 'Expenses', value: 'expense' },
];

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      const [txRes, catRes] = await Promise.all([
        getTransactions(params),
        getCategories(),
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter]);

  // Reload when screen comes into focus (after add/edit)
  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete transaction.');
          }
        },
      },
    ]);
  };

  // Client-side search filtering
  const filtered = transactions.filter(tx => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (tx.description || '').toLowerCase().includes(q) ||
      (tx.category_name || '').toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingScreen />;

  return (
    <View style={[styles.flex, { backgroundColor: theme.bgMain }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bgMain }]}>
        <View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Transactions</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{filtered.length} transactions</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('TransactionForm', {})}
        >
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search transactions..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Type filter */}
      <View style={styles.filterRow}>
        <FilterChips options={typeFilters} selected={typeFilter} onSelect={setTypeFilter} />
      </View>

      {/* Transaction list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => navigation.navigate('TransactionForm', { id: item.id })}
            onDelete={() => handleDelete(item.id)}
            showActions
          />
        )}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="📝"
            title="No transactions found"
            message={searchQuery ? 'Try a different search term.' : 'Add your first transaction.'}
            actionLabel={!searchQuery ? '+ Add Transaction' : undefined}
            onAction={!searchQuery ? () => navigation.navigate('TransactionForm', {}) : undefined}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
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
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  filterRow: {
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
