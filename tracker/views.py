import io
import csv
import json
from datetime import datetime, timedelta
from decimal import Decimal

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.http import HttpResponse
from django.utils import timezone

from rest_framework import generics, permissions, status as drf_status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes as perm_classes

from .models import Transaction, Category, EmailNotificationPreference, Budget, RecurringTransaction
from .serializers import TransactionSerializer, CategorySerializer, BudgetSerializer, RecurringTransactionSerializer
from .forms import TransactionForm, NotificationPreferenceForm, BudgetForm, RecurringTransactionForm
from .emails import check_large_expense, check_budget_alert


# ── REST API Views ──

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class   = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs    = Transaction.objects.filter(user=self.request.user)
        ttype = self.request.query_params.get('type')
        cat   = self.request.query_params.get('category')
        month = self.request.query_params.get('month')
        year  = self.request.query_params.get('year')
        if ttype: qs = qs.filter(type=ttype)
        if cat:   qs = qs.filter(category__name__icontains=cat)
        if month: qs = qs.filter(date__year=month[:4], date__month=month[5:])
        if year:  qs = qs.filter(date__year=year)
        return qs

    def perform_create(self, serializer):
        tx = serializer.save(user=self.request.user)
        check_large_expense(tx)
        check_budget_alert(tx)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class SummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs    = Transaction.objects.filter(user=request.user)
        month = request.query_params.get('month')
        year  = request.query_params.get('year')
        if month: qs = qs.filter(date__year=month[:4], date__month=month[5:])
        if year:  qs = qs.filter(date__year=year)

        amounts       = [float(t.amount) for t in qs]
        balance       = sum(amounts)
        total_income  = sum(a for a in amounts if a > 0)
        total_expense = abs(sum(a for a in amounts if a < 0))
        total_volume  = sum(abs(a) for a in amounts)

        return Response({
            'balance':       balance,
            'total_income':  total_income,
            'total_expense': total_expense,
            'total_volume':  total_volume,
        })


class CategoryListView(generics.ListCreateAPIView):
    serializer_class   = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset           = Category.objects.all()


@api_view(['POST'])
@perm_classes([permissions.AllowAny])
def api_register(request):
    from django.contrib.auth.models import User
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    email    = request.data.get('email', '').strip()
    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=drf_status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken.'}, status=drf_status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'id': user.id, 'username': user.username}, status=drf_status.HTTP_201_CREATED)


@api_view(['GET'])
def api_user_info(request):
    user = request.user
    prefs, _ = EmailNotificationPreference.objects.get_or_create(user=user)
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined,
        'notification_prefs': {
            'weekly_summary': prefs.weekly_summary,
            'budget_alerts': prefs.budget_alerts,
            'large_expense_alert': prefs.large_expense_alert,
            'large_expense_threshold': float(prefs.large_expense_threshold),
        },
    })


class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class   = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Budget.objects.filter(user=self.request.user)
        month = self.request.query_params.get('month')
        if month:
            qs = qs.filter(month__year=month[:4], month__month=month[5:])
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)


class RecurringTransactionListCreateView(generics.ListCreateAPIView):
    serializer_class   = RecurringTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RecurringTransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = RecurringTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)


# ── Helper ──

def _build_financials(qs):
    amounts       = [float(t.amount) for t in qs]
    balance       = sum(amounts)
    total_income  = sum(a for a in amounts if a > 0)
    total_expense = abs(sum(a for a in amounts if a < 0))
    total_volume  = sum(abs(a) for a in amounts)

    running = 0
    balance_points  = []
    transaction_log = []

    for tx in qs:
        running += float(tx.amount)
        balance_points.append({'x': str(tx.date), 'y': round(running, 2)})
        transaction_log.append({
            'date':        str(tx.date),
            'description': tx.description or '',
            'category':    tx.category.name if tx.category else 'Uncategorized',
            'type':        tx.type,
            'amount':      float(tx.amount),
            'balance':     round(running, 2),
        })

    return {
        'balance':       balance,
        'total_income':  total_income,
        'total_expense': total_expense,
        'total_volume':  total_volume,
        'balance_points':  balance_points,
        'transaction_log': transaction_log,
    }


def signup_view(request):
    form = UserCreationForm(request.POST or None)
    if form.is_valid():
        form.save()
        messages.success(request, 'Account created! You can now log in.')
        return redirect('login')
    return render(request, 'registration/signup.html', {'form': form})


# ── Template Views ──

@login_required
def dashboard(request):
    month = request.GET.get('month', '')
    qs    = Transaction.objects.filter(user=request.user).order_by('date', 'created_at')
    if month:
        qs = qs.filter(date__year=month[:4], date__month=month[5:])

    fin = _build_financials(qs)

    by_cat = (qs.filter(type='expense')
               .values('category__name')
               .annotate(total=Sum('amount'))
               .order_by('total'))
    pie_data = {
        'labels': [r['category__name'] or 'Uncategorized' for r in by_cat],
        'values': [abs(float(r['total'])) for r in by_cat],
    }

    return render(request, 'dashboard.html', {
        'summary': {
            'total_income':  fin['total_income'],
            'total_expense': fin['total_expense'],
            'balance':       fin['balance'],
            'total_volume':  fin['total_volume'],
        },
        'pie_data':        json.dumps(pie_data),
        'balance_points':  json.dumps(fin['balance_points']),
        'transaction_log': json.dumps(fin['transaction_log']),
        'selected_month':  month,
    })


@login_required
def transaction_list(request):
    qs    = Transaction.objects.filter(user=request.user).select_related('category').order_by('-date', '-created_at')
    ttype = request.GET.get('type')
    month = request.GET.get('month')
    q     = request.GET.get('q', '').strip()
    cat   = request.GET.get('category')
    date_from = request.GET.get('date_from')
    date_to   = request.GET.get('date_to')

    if ttype:     qs = qs.filter(type=ttype)
    if month:     qs = qs.filter(date__year=month[:4], date__month=month[5:])
    if q:         qs = qs.filter(Q(description__icontains=q) | Q(category__name__icontains=q))
    if cat:       qs = qs.filter(category_id=cat)
    if date_from: qs = qs.filter(date__gte=date_from)
    if date_to:   qs = qs.filter(date__lte=date_to)

    fin = _build_financials(qs)
    categories = Category.objects.all().order_by('name')

    return render(request, 'transactions.html', {
        'transactions':  qs,
        'total_income':  fin['total_income'],
        'total_expense': fin['total_expense'],
        'balance':       fin['balance'],
        'total_volume':  fin['total_volume'],
        'categories':    categories,
        'search_q':      q,
    })


@login_required
def transaction_add(request):
    if request.method == 'POST':
        form = TransactionForm(request.POST, request.FILES)
    else:
        form = TransactionForm()
    if form.is_valid():
        tx      = form.save(commit=False)
        tx.user = request.user
        tx.save()
        check_large_expense(tx)
        check_budget_alert(tx)
        messages.success(request, 'Transaction added successfully.')
        return redirect('transaction_list')
    return render(request, 'transaction_form.html', {'form': form, 'title': 'Add Transaction'})


@login_required
def transaction_edit(request, pk):
    tx = get_object_or_404(Transaction, pk=pk, user=request.user)
    if request.method == 'POST':
        form = TransactionForm(request.POST, request.FILES, instance=tx)
    else:
        form = TransactionForm(instance=tx)
    if form.is_valid():
        form.save()
        messages.success(request, 'Transaction updated.')
        return redirect('transaction_list')
    return render(request, 'transaction_form.html', {'form': form, 'title': 'Edit Transaction'})


@login_required
def transaction_delete(request, pk):
    tx = get_object_or_404(Transaction, pk=pk, user=request.user)
    if request.method == 'POST':
        tx.delete()
        messages.success(request, 'Transaction deleted.')
        return redirect('transaction_list')
    return render(request, 'transaction_confirm_delete.html', {'tx': tx})


# ── Reports & Analytics ──

@login_required
def reports(request):
    qs = Transaction.objects.filter(user=request.user)

    # Date range filter
    date_range = request.GET.get('range', '6m')
    today = timezone.now().date()

    if date_range == '1m':
        start_date = today - timedelta(days=30)
    elif date_range == '3m':
        start_date = today - timedelta(days=90)
    elif date_range == '6m':
        start_date = today - timedelta(days=180)
    elif date_range == '1y':
        start_date = today - timedelta(days=365)
    elif date_range == 'all':
        start_date = None
    else:
        start_date = today - timedelta(days=180)

    if start_date:
        qs = qs.filter(date__gte=start_date)

    # Monthly breakdown
    monthly_data = (
        qs.annotate(month=TruncMonth('date'))
        .values('month')
        .annotate(
            income=Sum('amount', filter=Q(type='income')),
            expense=Sum('amount', filter=Q(type='expense')),
        )
        .order_by('month')
    )

    monthly_labels = []
    monthly_income = []
    monthly_expense = []
    for row in monthly_data:
        monthly_labels.append(row['month'].strftime('%b %Y'))
        monthly_income.append(float(row['income'] or 0))
        monthly_expense.append(abs(float(row['expense'] or 0)))

    # Category breakdown (expenses)
    category_data = (
        qs.filter(type='expense')
        .values('category__name')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('total')
    )

    cat_labels = [r['category__name'] or 'Uncategorized' for r in category_data]
    cat_values = [abs(float(r['total'])) for r in category_data]
    cat_counts = [r['count'] for r in category_data]

    # Category breakdown (income)
    income_cat_data = (
        qs.filter(type='income')
        .values('category__name')
        .annotate(total=Sum('amount'), count=Count('id'))
        .order_by('-total')
    )

    income_cat_labels = [r['category__name'] or 'Uncategorized' for r in income_cat_data]
    income_cat_values = [float(r['total'] or 0) for r in income_cat_data]

    # Top expenses
    top_expenses = (
        qs.filter(type='expense')
        .order_by('amount')[:10]
    )

    # Weekly spending trend
    weekly_data = (
        qs.filter(type='expense')
        .annotate(week=TruncWeek('date'))
        .values('week')
        .annotate(total=Sum('amount'))
        .order_by('week')
    )

    weekly_labels = [r['week'].strftime('%b %d') for r in weekly_data]
    weekly_values = [abs(float(r['total'])) for r in weekly_data]

    # Summary stats
    total_income = sum(monthly_income)
    total_expense = sum(monthly_expense)
    avg_daily_expense = total_expense / max((today - (start_date or today)).days, 1) if total_expense else 0
    transaction_count = qs.count()

    context = {
        'date_range': date_range,
        'monthly_labels': json.dumps(monthly_labels),
        'monthly_income': json.dumps(monthly_income),
        'monthly_expense': json.dumps(monthly_expense),
        'cat_labels': json.dumps(cat_labels),
        'cat_values': json.dumps(cat_values),
        'cat_counts': json.dumps(cat_counts),
        'income_cat_labels': json.dumps(income_cat_labels),
        'income_cat_values': json.dumps(income_cat_values),
        'weekly_labels': json.dumps(weekly_labels),
        'weekly_values': json.dumps(weekly_values),
        'top_expenses': top_expenses,
        'total_income': total_income,
        'total_expense': total_expense,
        'balance': total_income - total_expense,
        'avg_daily_expense': round(avg_daily_expense, 2),
        'transaction_count': transaction_count,
    }

    return render(request, 'reports.html', context)


# ── CSV Export ──

@login_required
def export_csv(request):
    qs = Transaction.objects.filter(user=request.user).order_by('-date', '-created_at')

    month = request.GET.get('month')
    ttype = request.GET.get('type')
    if month:
        qs = qs.filter(date__year=month[:4], date__month=month[5:])
    if ttype:
        qs = qs.filter(type=ttype)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="transactions_{datetime.now().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Type', 'Category', 'Description', 'Amount'])

    for tx in qs:
        writer.writerow([
            tx.date,
            tx.type,
            tx.category.name if tx.category else 'Uncategorized',
            tx.description,
            float(tx.amount),
        ])

    return response


# ── PDF Export ──

@login_required
def export_pdf(request):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError:
        messages.error(request, 'PDF export requires reportlab. Install it with: pip install reportlab')
        return redirect('transaction_list')

    qs = Transaction.objects.filter(user=request.user).order_by('-date', '-created_at')

    month = request.GET.get('month')
    ttype = request.GET.get('type')
    if month:
        qs = qs.filter(date__year=month[:4], date__month=month[5:])
    if ttype:
        qs = qs.filter(type=ttype)

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="transactions_{datetime.now().strftime("%Y%m%d")}.pdf"'

    doc = SimpleDocTemplate(response, pagesize=A4, topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph('Expense Tracker - Transaction Report', styles['Title']))
    elements.append(Spacer(1, 10*mm))

    # Summary
    fin = _build_financials(qs)
    summary_data = [
        ['Total Income', f"{fin['total_income']:.2f}"],
        ['Total Expenses', f"{fin['total_expense']:.2f}"],
        ['Balance', f"{fin['balance']:.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[80*mm, 60*mm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFF3E0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1A1A1A')),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E8910C')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 10*mm))

    # Transaction table
    data = [['Date', 'Type', 'Category', 'Description', 'Amount']]
    for tx in qs:
        data.append([
            str(tx.date),
            tx.type.capitalize(),
            tx.category.name if tx.category else 'Uncategorized',
            tx.description[:30],
            f"{float(tx.amount):.2f}",
        ])

    if len(data) > 1:
        table = Table(data, colWidths=[30*mm, 22*mm, 35*mm, 50*mm, 28*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8910C')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F0EDE8')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAF7')]),
        ]))
        elements.append(table)

    doc.build(elements)
    return response


# ── Budget Views ──

@login_required
def budget_list(request):
    today = timezone.now().date()
    month_str = request.GET.get('month', today.strftime('%Y-%m'))
    try:
        year, mo = int(month_str[:4]), int(month_str[5:])
    except (ValueError, IndexError):
        year, mo = today.year, today.month

    from datetime import date
    selected_month = date(year, mo, 1)

    budgets = Budget.objects.filter(user=request.user, month=selected_month).select_related('category')

    budget_data = []
    for b in budgets:
        spent = abs(float(
            Transaction.objects.filter(
                user=request.user, category=b.category, type='expense',
                date__year=year, date__month=mo
            ).aggregate(total=Sum('amount'))['total'] or 0
        ))
        limit = float(b.amount)
        pct = min(round(spent / limit * 100, 1), 100) if limit > 0 else 0
        budget_data.append({
            'id': b.id,
            'category': b.category.name,
            'amount': limit,
            'spent': spent,
            'remaining': max(limit - spent, 0),
            'pct': pct,
            'over': spent > limit,
        })

    return render(request, 'budgets.html', {
        'budgets': budget_data,
        'selected_month': month_str,
        'month_display': selected_month.strftime('%B %Y'),
    })


@login_required
def budget_add(request):
    if request.method == 'POST':
        form = BudgetForm(request.POST)
    else:
        form = BudgetForm()
    if form.is_valid():
        budget = form.save(commit=False)
        budget.user = request.user
        try:
            budget.save()
            messages.success(request, 'Budget created successfully.')
            return redirect('budget_list')
        except Exception:
            messages.error(request, 'A budget for that category and month already exists.')
    return render(request, 'budget_form.html', {'form': form, 'title': 'Add Budget'})


@login_required
def budget_edit(request, pk):
    budget = get_object_or_404(Budget, pk=pk, user=request.user)
    if request.method == 'POST':
        form = BudgetForm(request.POST, instance=budget)
    else:
        form = BudgetForm(instance=budget)
    if form.is_valid():
        try:
            form.save()
            messages.success(request, 'Budget updated.')
            return redirect('budget_list')
        except Exception:
            messages.error(request, 'A budget for that category and month already exists.')
    return render(request, 'budget_form.html', {'form': form, 'title': 'Edit Budget'})


@login_required
def budget_delete(request, pk):
    budget = get_object_or_404(Budget, pk=pk, user=request.user)
    if request.method == 'POST':
        budget.delete()
        messages.success(request, 'Budget deleted.')
        return redirect('budget_list')
    return render(request, 'budget_confirm_delete.html', {'budget': budget})


# ── Recurring Transaction Views ──

@login_required
def recurring_list(request):
    recurring = RecurringTransaction.objects.filter(user=request.user)
    active = recurring.filter(is_active=True)
    inactive = recurring.filter(is_active=False)
    return render(request, 'recurring_transactions.html', {
        'active': active,
        'inactive': inactive,
    })


@login_required
def recurring_add(request):
    if request.method == 'POST':
        form = RecurringTransactionForm(request.POST)
    else:
        form = RecurringTransactionForm()
    if form.is_valid():
        rec = form.save(commit=False)
        rec.user = request.user
        rec.next_run = rec.start_date
        rec.save()
        messages.success(request, 'Recurring transaction created.')
        return redirect('recurring_list')
    return render(request, 'recurring_form.html', {'form': form, 'title': 'Add Recurring Transaction'})


@login_required
def recurring_edit(request, pk):
    rec = get_object_or_404(RecurringTransaction, pk=pk, user=request.user)
    if request.method == 'POST':
        form = RecurringTransactionForm(request.POST, instance=rec)
    else:
        form = RecurringTransactionForm(instance=rec)
    if form.is_valid():
        form.save()
        messages.success(request, 'Recurring transaction updated.')
        return redirect('recurring_list')
    return render(request, 'recurring_form.html', {'form': form, 'title': 'Edit Recurring Transaction'})


@login_required
def recurring_delete(request, pk):
    rec = get_object_or_404(RecurringTransaction, pk=pk, user=request.user)
    if request.method == 'POST':
        rec.delete()
        messages.success(request, 'Recurring transaction deleted.')
        return redirect('recurring_list')
    return render(request, 'recurring_confirm_delete.html', {'recurring': rec})


@login_required
def recurring_toggle(request, pk):
    rec = get_object_or_404(RecurringTransaction, pk=pk, user=request.user)
    if request.method == 'POST':
        rec.is_active = not rec.is_active
        rec.save()
        status = 'activated' if rec.is_active else 'paused'
        messages.success(request, f'Recurring transaction {status}.')
    return redirect('recurring_list')


# ── User Profile ──

@login_required
def profile(request):
    user = request.user
    tx_count = Transaction.objects.filter(user=user).count()
    budget_count = Budget.objects.filter(user=user).count()
    recurring_count = RecurringTransaction.objects.filter(user=user, is_active=True).count()
    prefs, _ = EmailNotificationPreference.objects.get_or_create(user=user)

    # This month's summary
    today = timezone.now().date()
    month_txs = Transaction.objects.filter(user=user, date__year=today.year, date__month=today.month)
    amounts = [float(t.amount) for t in month_txs]
    month_income = sum(a for a in amounts if a > 0)
    month_expense = abs(sum(a for a in amounts if a < 0))

    return render(request, 'profile.html', {
        'tx_count': tx_count,
        'budget_count': budget_count,
        'recurring_count': recurring_count,
        'prefs': prefs,
        'month_income': month_income,
        'month_expense': month_expense,
        'month_name': today.strftime('%B %Y'),
    })


# ── Notification Preferences ──

@login_required
def notification_settings(request):
    prefs, created = EmailNotificationPreference.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = NotificationPreferenceForm(request.POST, instance=prefs)
        if form.is_valid():
            form.save()
            messages.success(request, 'Notification preferences updated.')
            return redirect('notification_settings')
    else:
        form = NotificationPreferenceForm(instance=prefs)
    return render(request, 'notification_settings.html', {'form': form})
