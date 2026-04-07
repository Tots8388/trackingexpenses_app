from django import forms
from .models import Transaction, EmailNotificationPreference, Budget, RecurringTransaction


class TransactionForm(forms.ModelForm):
    class Meta:
        model  = Transaction
        fields = ['type', 'amount', 'category', 'date', 'description', 'receipt']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'type': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'receipt': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
        }

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount is not None and amount <= 0:
            raise forms.ValidationError('Amount must be greater than zero.')
        return abs(amount)


class BudgetForm(forms.ModelForm):
    class Meta:
        model  = Budget
        fields = ['category', 'amount', 'month']
        widgets = {
            'category': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0.01'}),
            'month': forms.DateInput(attrs={'type': 'month', 'class': 'form-control'}),
        }

    def clean_month(self):
        month = self.cleaned_data.get('month')
        if month:
            return month.replace(day=1)
        return month

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount is not None and amount <= 0:
            raise forms.ValidationError('Budget amount must be greater than zero.')
        return amount


class RecurringTransactionForm(forms.ModelForm):
    class Meta:
        model  = RecurringTransaction
        fields = ['type', 'amount', 'category', 'description', 'frequency', 'start_date', 'end_date']
        widgets = {
            'type': forms.Select(attrs={'class': 'form-select'}),
            'amount': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01', 'min': '0.01'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'description': forms.TextInput(attrs={'class': 'form-control'}),
            'frequency': forms.Select(attrs={'class': 'form-select'}),
            'start_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'end_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
        }

    def clean_amount(self):
        amount = self.cleaned_data.get('amount')
        if amount is not None and amount <= 0:
            raise forms.ValidationError('Amount must be greater than zero.')
        return abs(amount)


class NotificationPreferenceForm(forms.ModelForm):
    class Meta:
        model  = EmailNotificationPreference
        fields = ['weekly_summary', 'budget_alerts', 'large_expense_alert', 'large_expense_threshold']
        widgets = {
            'large_expense_threshold': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
        }
