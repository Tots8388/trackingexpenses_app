import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { getCategories, getRecurringItem, createRecurring, updateRecurring } from '../api/endpoints';
import type { Category } from '../api/endpoints';

const frequencies = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 Weeks', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function RecurringFormScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const editId = route.params?.id as number | undefined;
  const isEdit = !!editId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const catRes = await getCategories();
        setCategories(catRes.data);

        if (isEdit) {
          const res = await getRecurringItem(editId);
          const r = res.data;
          setType(r.type);
          setAmount(Math.abs(Number(r.amount)).toString());
          setCategory(r.category);
          setDescription(r.description || '');
          setFrequency(r.frequency);
          setStartDate(new Date(r.start_date));
          setEndDate(r.end_date ? new Date(r.end_date) : null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [editId, isEdit]);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        type, amount: Number(amount), category, description,
        frequency, start_date: formatDate(startDate),
      };
      if (endDate) payload.end_date = formatDate(endDate);

      if (isEdit) {
        await updateRecurring(editId, payload);
      } else {
        await createRecurring(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

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
            {isEdit ? 'Edit Recurring' : 'Add Recurring'}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {/* Type */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
          <View style={styles.typeRow}>
            {(['income', 'expense'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, {
                  backgroundColor: type === t ? (t === 'income' ? theme.accentGreenLight : theme.accentRedLight) : theme.bgMain,
                  borderColor: type === t ? (t === 'income' ? theme.accentGreen : theme.accentRed) : theme.border,
                }]}
                onPress={() => setType(t)}
              >
                <Text style={{ color: type === t ? (t === 'income' ? theme.accentGreen : theme.accentRed) : theme.textMuted, fontWeight: '700', fontSize: 14 }}>
                  {t === 'income' ? '↑ Income' : '↓ Expense'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Amount</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
            value={amount} onChangeText={setAmount}
            keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={theme.textMuted}
          />

          {/* Category */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
          <View style={[styles.pickerWrap, { backgroundColor: theme.bgMain, borderColor: theme.border }]}>
            <Picker selectedValue={category} onValueChange={setCategory} style={{ color: theme.textPrimary }} dropdownIconColor={theme.textMuted}>
              <Picker.Item label="Select category" value={null} color={theme.textMuted} />
              {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
            </Picker>
          </View>

          {/* Description */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.bgMain, color: theme.textPrimary, borderColor: theme.border }]}
            value={description} onChangeText={setDescription}
            placeholder="Optional description" placeholderTextColor={theme.textMuted}
          />

          {/* Frequency */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
          <View style={[styles.pickerWrap, { backgroundColor: theme.bgMain, borderColor: theme.border }]}>
            <Picker selectedValue={frequency} onValueChange={setFrequency} style={{ color: theme.textPrimary }} dropdownIconColor={theme.textMuted}>
              {frequencies.map(f => <Picker.Item key={f.value} label={f.label} value={f.value} />)}
            </Picker>
          </View>

          {/* Start Date */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Start Date</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: theme.bgMain, borderColor: theme.border, justifyContent: 'center' }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={{ color: theme.textPrimary, fontSize: 15 }}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => { setShowStartPicker(Platform.OS === 'ios'); if (d) setStartDate(d); }} />
          )}

          {/* End Date (optional) */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>End Date (optional)</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: theme.bgMain, borderColor: theme.border, justifyContent: 'center' }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={{ color: endDate ? theme.textPrimary : theme.textMuted, fontSize: 15 }}>
              {endDate ? formatDate(endDate) : 'No end date'}
            </Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker value={endDate || new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => { setShowEndPicker(Platform.OS === 'ios'); if (d) setEndDate(d); }} />
          )}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            onPress={handleSubmit} disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : (isEdit ? 'Update Recurring' : 'Add Recurring')}
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
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5 },
  pickerWrap: { borderWidth: 1.5, borderRadius: 10, marginBottom: 16, overflow: 'hidden' },
  submitBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
