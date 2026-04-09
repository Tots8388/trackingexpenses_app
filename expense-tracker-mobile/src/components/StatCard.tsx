import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  label: string;
  value: number;
  type?: 'income' | 'expense' | 'balance';
  icon?: string;
};

export default function StatCard({ label, value, type, icon }: Props) {
  const { theme } = useTheme();

  const getColor = () => {
    if (type === 'income') return theme.accentGreen;
    if (type === 'expense') return theme.accentRed;
    if (type === 'balance') return theme.primary;
    return theme.textPrimary;
  };

  const getBgColor = () => {
    if (type === 'income') return theme.accentGreenLight;
    if (type === 'expense') return theme.accentRedLight;
    if (type === 'balance') return theme.primaryLight;
    return theme.bgMain;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
          <Text style={[styles.value, { color: getColor() }]}>
            {type ? `$${Math.abs(value).toFixed(2)}` : Math.round(value).toLocaleString()}
          </Text>
        </View>
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: getBgColor() }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
});
