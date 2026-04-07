from rest_framework import serializers
from .models import Transaction, Category, Budget, RecurringTransaction


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['id', 'name']


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = Transaction
        fields = [
            'id', 'amount', 'category', 'category_name',
            'type', 'date', 'description', 'created_at'
        ]
        read_only_fields = ['created_at']

    def validate_amount(self, value):
        # Always validate absolute value — sign is enforced in model.save()
        if abs(value) <= 0:
            raise serializers.ValidationError('Amount must be non-zero.')
        return value


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent = serializers.SerializerMethodField()

    class Meta:
        model  = Budget
        fields = ['id', 'category', 'category_name', 'amount', 'month', 'spent']
        read_only_fields = ['spent']

    def get_spent(self, obj):
        from django.db.models import Sum
        total = Transaction.objects.filter(
            user=obj.user, category=obj.category, type='expense',
            date__year=obj.month.year, date__month=obj.month.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        return abs(float(total))


class RecurringTransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model  = RecurringTransaction
        fields = [
            'id', 'amount', 'category', 'category_name', 'type',
            'description', 'frequency', 'start_date', 'end_date',
            'next_run', 'is_active', 'created_at'
        ]
        read_only_fields = ['created_at', 'next_run']

    def create(self, validated_data):
        validated_data['next_run'] = validated_data['start_date']
        return super().create(validated_data)
