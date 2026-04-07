from django.urls import path
from . import views
from tracker.views import signup_view

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('transactions/', views.transaction_list, name='transaction_list'),
    path('transactions/add/', views.transaction_add, name='transaction_add'),
    path('transactions/<int:pk>/edit/', views.transaction_edit, name='transaction_edit'),
    path('transactions/<int:pk>/delete/', views.transaction_delete, name='transaction_delete'),
    path('reports/', views.reports, name='reports'),
    path('export/csv/', views.export_csv, name='export_csv'),
    path('export/pdf/', views.export_pdf, name='export_pdf'),
    path('budgets/', views.budget_list, name='budget_list'),
    path('budgets/add/', views.budget_add, name='budget_add'),
    path('budgets/<int:pk>/edit/', views.budget_edit, name='budget_edit'),
    path('budgets/<int:pk>/delete/', views.budget_delete, name='budget_delete'),
    path('recurring/', views.recurring_list, name='recurring_list'),
    path('recurring/add/', views.recurring_add, name='recurring_add'),
    path('recurring/<int:pk>/edit/', views.recurring_edit, name='recurring_edit'),
    path('recurring/<int:pk>/delete/', views.recurring_delete, name='recurring_delete'),
    path('recurring/<int:pk>/toggle/', views.recurring_toggle, name='recurring_toggle'),
    path('profile/', views.profile, name='profile'),
    path('settings/notifications/', views.notification_settings, name='notification_settings'),
    path('signup/', signup_view, name='signup'),
]
