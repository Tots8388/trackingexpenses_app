from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.api_register, name='api_register'),
    path('password-reset/', views.api_password_reset_request, name='api_password_reset'),
    path('password-reset/confirm/', views.api_password_reset_confirm, name='api_password_reset_confirm'),
    path('me/', views.api_user_info, name='api_user_info'),
    path('transactions/', views.TransactionListCreateView.as_view(), name='api_transaction_list'),
    path('transactions/<int:pk>/', views.TransactionDetailView.as_view(), name='api_transaction_detail'),
    path('categories/', views.CategoryListView.as_view(), name='api_category_list'),
    path('summary/', views.SummaryView.as_view(), name='api_summary'),
    path('budgets/', views.BudgetListCreateView.as_view(), name='api_budget_list'),
    path('budgets/<int:pk>/', views.BudgetDetailView.as_view(), name='api_budget_detail'),
    path('recurring/', views.RecurringTransactionListCreateView.as_view(), name='api_recurring_list'),
    path('recurring/<int:pk>/', views.RecurringTransactionDetailView.as_view(), name='api_recurring_detail'),
]
