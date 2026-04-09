import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import type { Transaction } from '../api/endpoints';

type Props = {
  transaction: Transaction;
  onPress?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
};

export default function TransactionItem({ transaction: tx, onPress, onDelete, showActions }: Props) {
  const { theme } = useTheme();
  const isIncome = tx.type === 'income';
  const color = isIncome ? theme.accentGreen : theme.accentRed;
  const bgColor = isIncome ? theme.accentGreenLight : theme.accentRedLight;

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: theme.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <View style={[styles.icon, { backgroundColor: bgColor }]}>
        <Ionicons name={isIncome ? 'arrow-up' : 'arrow-down'} size={20} color={color} />
      </View>

      <View style={styles.middle}>
        <Text style={[styles.desc, { color: theme.textPrimary }]} numberOfLines={1}>
          {tx.description || 'No description'}
        </Text>
        <Text style={[styles.cat, { color: theme.textMuted }]}>
          {tx.category_name || 'Uncategorized'}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color }]}>
          {isIncome ? '+' : '-'}${Math.abs(Number(tx.amount)).toFixed(2)}
        </Text>
        <Text style={[styles.date, { color: theme.textMuted }]}>{tx.date}</Text>
      </View>

      {showActions && onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={theme.accentRed} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  middle: {
    flex: 1,
  },
  desc: {
    fontSize: 14,
    fontWeight: '700',
  },
  cat: {
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  date: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    marginLeft: 10,
    padding: 4,
  },
});
