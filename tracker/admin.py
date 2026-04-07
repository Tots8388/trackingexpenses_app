from django.contrib import admin
from .models import Transaction, Category, Budget, RecurringTransaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'amount', 'month']
    list_filter = ['category', 'month']
    search_fields = ['user__username', 'category__name']

@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'description', 'amount', 'type', 'frequency', 'next_run', 'is_active']
    list_filter = ['frequency', 'type', 'is_active']
    search_fields = ['description', 'user__username']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'type', 'category', 'date', 'description']
    list_filter = ['type', 'category', 'date']
    search_fields = ['description', 'user__username']
    ordering = ['-date']
