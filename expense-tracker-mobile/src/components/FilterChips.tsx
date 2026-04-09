import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
};

export default function FilterChips({ options, selected, onSelect }: Props) {
  const { theme } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {options.map(opt => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.primaryLight : theme.bgCard,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.chipText, { color: active ? theme.primary : theme.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
