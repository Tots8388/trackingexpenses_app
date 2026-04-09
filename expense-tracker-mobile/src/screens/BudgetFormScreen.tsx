import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../theme/ThemeContext';
import { getCategories, getBudget, createBudget, updateBudget } from '../api/endpoints';
import type { Category } from '../api/endpoints';

export default function BudgetFormScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const editId = route.params?.id as number | undefined;
  const isEdit = !!editId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const catRes = await getCategories();
        setCategories(catRes.data);

        if (isEdit) {
          const bdgRes = await getBudget(editId);
          const b = bdgRes.data;
          setCategory(b.category);
          setAmount(Number(b.amount).toString());
          setMonth(b.month);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [editId, isEdit]);

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const payload = { category, amount: Number(amount), month };
      if (isEdit) {
        await updateBudget(editId, payload);
      } else {
        await createBudget(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Failed to save budget.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Month picker using simple year-month selection
  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };

  const monthDisplay = (() => {
    const [y, m] = month.split('-').map(Number);
    const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${names[m - 1]} ${y}`;
  })();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {isEdit ? 'Edit Budget' : 'Add Budget'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <View style={[styles.pickerWrap, { backgroundColor: theme.bgMain, borderColor: theme.border }]}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={{ color: theme.textPrimary }}
              dropdownIconColor={theme.textMuted}
            >
              <Picker.Item label="Select category" value={null} color={theme.textMuted} />
              {categories.map(c => (
                <Picker.Item key={c.id} label={c.name} value={c.id} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Budget Amount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={theme.textMuted}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Month</Text>
          <View style={[styles.monthPicker, { borderColor: theme.border }]}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Text style={{ color: theme.primary, fontSize: 20, fontWeight: '700' }}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: theme.textPrimary }]}>{monthDisplay}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Text style={{ color: theme.primary, fontSize: 20, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : (isEdit ? 'Update Budget' : 'Add Budget')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { paddingTop: 48, marginBottom: 20 },
  backBtn: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  card: { borderRadius: 14, padding: 24, borderWidth: 1 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 16,
  },
  pickerWrap: { borderWidth: 1.5, borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
  monthPicker: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  monthText: { fontSize: 15, fontWeight: '600' },
  submitBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
