import React, { useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getRecurring, patchRecurring, deleteRecurring } from '../api/endpoints';
import type { RecurringTransaction } from '../api/endpoints';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import type { RecurringStackParamList } from '../navigation/MainTabs';

type Nav = NativeStackNavigationProp<RecurringStackParamList, 'RecurringList'>;

export default function RecurringScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data } = await getRecurring();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleToggle = async (item: RecurringTransaction) => {
    try {
      await patchRecurring(item.id, { is_active: !item.is_active });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch {
      Alert.alert('Error', 'Failed to update.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecurring(id);
            setItems(prev => prev.filter(i => i.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  const active = items.filter(i => i.is_active);
  const paused = items.filter(i => !i.is_active);
  const sections = [
    ...(active.length > 0 ? [{ title: 'Active', data: active }] : []),
    ...(paused.length > 0 ? [{ title: 'Paused', data: paused }] : []),
  ];

  const freqLabel = (f: string) => {
    if (f === 'weekly') return 'Weekly';
    if (f === 'biweekly') return 'Every 2 Weeks';
    return 'Monthly';
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.bgMain }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Recurring</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('RecurringForm', {})}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id.toString()}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income';
          const color = isIncome ? theme.accentGreen : theme.accentRed;
          const bgColor = isIncome ? theme.accentGreenLight : theme.accentRedLight;
          const dimmed = !item.is_active;

          return (
            <View style={[styles.itemCard, { backgroundColor: theme.bgCard, borderColor: theme.border, opacity: dimmed ? 0.6 : 1 }]}>
              <View style={styles.itemRow}>
                <View style={[styles.itemIcon, { backgroundColor: bgColor }]}>
                  <Ionicons name={isIncome ? 'arrow-up' : 'arrow-down'} size={18} color={color} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemDesc, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.description || item.category_name || 'Recurring'}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.textMuted }]}>
                    {freqLabel(item.frequency)} · Next: {item.next_run}
                  </Text>
                </View>
                <Text style={[styles.itemAmount, { color }]}>
                  {isIncome ? '+' : '-'}${Math.abs(Number(item.amount)).toFixed(2)}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => handleToggle(item)} style={styles.actionBtn}>
                  <Ionicons name={item.is_active ? 'pause' : 'play'} size={18} color={theme.primary} />
                </TouchableOpacity>
                {item.is_active && (
                  <TouchableOpacity onPress={() => navigation.navigate('RecurringForm', { id: item.id })} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={18} color={theme.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={theme.accentRed} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="🔄"
            title="No recurring transactions"
            message="Set up automatic recurring entries."
            actionLabel="+ Add Recurring"
            onAction={() => navigation.navigate('RecurringForm', {})}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 52 },
  backBtn: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  addBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 16, paddingVertical: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  itemCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 14, fontWeight: '700' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemAmount: { fontSize: 15, fontWeight: '800', marginLeft: 8 },
  itemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionBtn: { padding: 6, marginLeft: 12 },
});
