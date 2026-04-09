from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Transaction, Budget, EmailNotificationPreference


def send_password_reset_email(user):
    """Generate a 6-digit code, cache it for 10 minutes, and email it."""
    import random
    from django.core.cache import cache

    code = f'{random.randint(100000, 999999)}'
    cache_key = f'password_reset_{user.pk}'
    cache.set(cache_key, code, timeout=600)  # 10 minutes

    context = {
        'user': user,
        'code': code,
    }
    html = render_to_string('emails/password_reset_code.html', context)

    send_mail(
        subject='Password Reset Code - Expense Tracker',
        message=f'Your password reset code is: {code}\n\nThis code expires in 10 minutes.',
        from_email=None,
        recipient_list=[user.email],
        html_message=html,
        fail_silently=False,
    )


def _get_prefs(user):
    """Get or create notification preferences for a user."""
    prefs, _ = EmailNotificationPreference.objects.get_or_create(user=user)
    return prefs


def check_large_expense(transaction):
    """Send alert if a transaction exceeds the user's large expense threshold."""
    if transaction.type != 'expense':
        return

    prefs = _get_prefs(transaction.user)
    if not prefs.large_expense_alert:
        return

    amount = abs(transaction.amount)
    if amount < prefs.large_expense_threshold:
        return

    context = {
        'user': transaction.user,
        'transaction': transaction,
        'amount': amount,
        'threshold': prefs.large_expense_threshold,
    }
    html = render_to_string('emails/large_expense_alert.html', context)

    send_mail(
        subject=f'Large Expense Alert: ${amount:.2f}',
        message=f'You recorded a ${amount:.2f} expense ({transaction.description or "No description"}) '
                f'which exceeds your ${prefs.large_expense_threshold:.2f} threshold.',
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=[transaction.user.email or transaction.user.username],
        html_message=html,
        fail_silently=True,
    )


def check_budget_alert(transaction):
    """Send alert when spending reaches 80% or 100% of a category budget."""
    if transaction.type != 'expense':
        return

    prefs = _get_prefs(transaction.user)
    if not prefs.budget_alerts:
        return

    if not transaction.category:
        return

    today = timezone.now().date()
    budget = Budget.objects.filter(
        user=transaction.user,
        category=transaction.category,
        month__year=today.year,
        month__month=today.month,
    ).first()

    if not budget:
        return

    spent = abs(float(
        Transaction.objects.filter(
            user=transaction.user,
            category=transaction.category,
            type='expense',
            date__year=today.year,
            date__month=today.month,
        ).aggregate(total=Sum('amount'))['total'] or 0
    ))

    limit = float(budget.amount)
    if limit <= 0:
        return

    pct = spent / limit * 100

    # Only alert at 80% and 100% thresholds
    if pct >= 100:
        level = 'exceeded'
        level_pct = 100
    elif pct >= 80:
        level = 'approaching'
        level_pct = 80
    else:
        return

    context = {
        'user': transaction.user,
        'category': transaction.category.name,
        'spent': spent,
        'limit': limit,
        'pct': round(pct, 1),
        'level': level,
        'level_pct': level_pct,
    }
    html = render_to_string('emails/budget_alert.html', context)

    subject = (
        f'Budget {level.capitalize()}: {transaction.category.name} at {round(pct)}%'
    )
    send_mail(
        subject=subject,
        message=f'Your {transaction.category.name} spending is at ${spent:.2f} of ${limit:.2f} ({round(pct)}%).',
        from_email=None,
        recipient_list=[transaction.user.email or transaction.user.username],
        html_message=html,
        fail_silently=True,
    )


def send_weekly_summary(user):
    """Send a weekly spending summary email to a single user."""
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)

    transactions = Transaction.objects.filter(
        user=user,
        date__gte=week_ago,
        date__lte=today,
    ).order_by('-date')

    if not transactions.exists():
        return  # nothing to report

    amounts = [float(t.amount) for t in transactions]
    total_income = sum(a for a in amounts if a > 0)
    total_expense = abs(sum(a for a in amounts if a < 0))
    net = total_income - total_expense

    # Top expense categories
    by_cat = (
        transactions.filter(type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'))
        .order_by('total')[:5]
    )
    top_categories = [
        {'name': r['category__name'] or 'Uncategorized', 'total': abs(float(r['total']))}
        for r in by_cat
    ]

    context = {
        'user': user,
        'week_start': week_ago,
        'week_end': today,
        'total_income': total_income,
        'total_expense': total_expense,
        'net': net,
        'transaction_count': transactions.count(),
        'top_categories': top_categories,
    }
    html = render_to_string('emails/weekly_summary.html', context)

    send_mail(
        subject=f'Your Weekly Expense Summary ({week_ago.strftime("%b %d")} - {today.strftime("%b %d")})',
        message=f'This week: ${total_income:.2f} income, ${total_expense:.2f} expenses, '
                f'${net:+.2f} net. {transactions.count()} transactions.',
        from_email=None,
        recipient_list=[user.email or user.username],
        html_message=html,
        fail_silently=True,
    )
