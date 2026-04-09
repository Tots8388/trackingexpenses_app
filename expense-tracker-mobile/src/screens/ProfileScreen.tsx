import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { getSummary, getTransactions, getBudgets, getRecurring } from '../api/endpoints';
import StatCard from '../components/StatCard';
import LoadingScreen from '../components/LoadingScreen';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<any>();

  const [stats, setStats] = useState({
    totalIncome: 0, totalExpense: 0, balance: 0, txCount: 0, budgetCount: 0, recurringCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, txRes, bdgRes, recRes] = await Promise.all([
        getSummary(),
        getTransactions(),
        getBudgets(),
        getRecurring(),
      ]);
      setStats({
        totalIncome: sumRes.data.total_income,
        totalExpense: sumRes.data.total_expense,
        balance: sumRes.data.balance,
        txCount: txRes.data.length,
        budgetCount: bdgRes.data.length,
        recurringCount: recRes.data.filter(r => r.is_active).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) return <LoadingScreen />;

  const initial = (user?.username?.[0] || '?').toUpperCase();

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.bgMain }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Profile</Text>
      </View>

      {/* User Card */}
      <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.username, { color: theme.textPrimary }]}>{user?.username}</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || 'No email set'}</Text>
            {user?.first_name && (
              <Text style={[styles.fullName, { color: theme.textMuted }]}>
                {user.first_name} {user.last_name}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statHalf}><StatCard label="Income" value={stats.totalIncome} type="income" /></View>
          <View style={styles.statHalf}><StatCard label="Expenses" value={stats.totalExpense} type="expense" /></View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statHalf}><StatCard label="Balance" value={stats.balance} type="balance" /></View>
          <View style={styles.statHalf}><StatCard label="Transactions" value={stats.txCount} /></View>
        </View>
      </View>

      {/* Quick Info */}
      <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick Info</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="wallet" size={18} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Active Budgets</Text>
          </View>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>{stats.budgetCount}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="repeat" size={18} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Active Recurring</Text>
          </View>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>{stats.recurringCount}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="calendar" size={18} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Joined</Text>
          </View>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>
            {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '-'}
          </Text>
        </View>
      </View>

      {/* Settings */}
      <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Settings</Text>

        <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
          <View style={styles.infoLeft}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
          </View>
          <Text style={[styles.infoValue, { color: theme.textSecondary }]}>{isDark ? 'On' : 'Off'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => navigation.navigate('RecurringStack', { screen: 'RecurringList' })}
        >
          <View style={styles.infoLeft}>
            <Ionicons name="repeat" size={18} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: theme.textPrimary }]}>Recurring Transactions</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: theme.accentRed }]}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.accentRed} />
        <Text style={[styles.logoutText, { color: theme.accentRed }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { paddingTop: 48, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800' },
  card: { borderRadius: 14, padding: 20, borderWidth: 1, marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: '800' },
  userInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 14, marginTop: 2 },
  fullName: { fontSize: 13, marginTop: 2 },
  statsGrid: { marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statHalf: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, fontWeight: '600' },
  infoValue: { fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1.5, paddingVertical: 14, gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
});
