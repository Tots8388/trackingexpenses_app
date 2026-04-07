from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Transaction(models.Model):
    INCOME  = 'income'
    EXPENSE = 'expense'
    TYPE_CHOICES = [(INCOME, 'Income'), (EXPENSE, 'Expense')]

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    category    = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    type        = models.CharField(max_length=10, choices=TYPE_CHOICES)
    date        = models.DateField()
    description = models.CharField(max_length=255, blank=True)
    receipt     = models.ImageField(upload_to='receipts/', null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'created_at']

    def save(self, *args, **kwargs):
        if self.type == 'expense':
            self.amount = -abs(self.amount)
        else:
            self.amount = abs(self.amount)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.type}: {self.amount} ({self.date})'


class Budget(models.Model):
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount   = models.DecimalField(max_digits=12, decimal_places=2)  # monthly limit
    month    = models.DateField(help_text='First day of the budget month')

    class Meta:
        unique_together = ['user', 'category', 'month']
        ordering = ['-month', 'category__name']

    def __str__(self):
        return f'{self.category.name} - {self.amount} ({self.month.strftime("%b %Y")})'


class RecurringTransaction(models.Model):
    WEEKLY   = 'weekly'
    BIWEEKLY = 'biweekly'
    MONTHLY  = 'monthly'
    FREQUENCY_CHOICES = [
        (WEEKLY, 'Weekly'),
        (BIWEEKLY, 'Every 2 Weeks'),
        (MONTHLY, 'Monthly'),
    ]

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recurring_transactions')
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    category    = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)
    type        = models.CharField(max_length=10, choices=Transaction.TYPE_CHOICES)
    description = models.CharField(max_length=255, blank=True)
    frequency   = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default=MONTHLY)
    start_date  = models.DateField()
    end_date    = models.DateField(null=True, blank=True)
    next_run    = models.DateField()
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['next_run']

    def __str__(self):
        return f'{self.description or self.category} - {self.frequency} ({self.amount})'

    def advance_next_run(self):
        from datetime import timedelta
        if self.frequency == self.WEEKLY:
            self.next_run += timedelta(weeks=1)
        elif self.frequency == self.BIWEEKLY:
            self.next_run += timedelta(weeks=2)
        elif self.frequency == self.MONTHLY:
            month = self.next_run.month % 12 + 1
            year = self.next_run.year + (1 if month == 1 else 0)
            day = min(self.next_run.day, 28)  # safe for all months
            self.next_run = self.next_run.replace(year=year, month=month, day=day)

        if self.end_date and self.next_run > self.end_date:
            self.is_active = False
        self.save()


class EmailNotificationPreference(models.Model):
    user               = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_prefs')
    weekly_summary     = models.BooleanField(default=True)
    budget_alerts      = models.BooleanField(default=True)
    large_expense_alert = models.BooleanField(default=True)
    large_expense_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=1000)

    def __str__(self):
        return f'Notification prefs for {self.user.username}'
