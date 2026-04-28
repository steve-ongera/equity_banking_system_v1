from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView, RegisterView, MeView,
    AccountListView, AccountDetailView,
    TransactionListView,
    DepositView, WithdrawView, TransferView,
    NotificationListView, MarkNotificationReadView,
    FeeStructureListView, DashboardView,
)

urlpatterns = [
    # Auth
    path('auth/login/',    LoginView.as_view(),         name='login'),
    path('auth/register/', RegisterView.as_view(),      name='register'),
    path('auth/refresh/',  TokenRefreshView.as_view(),  name='token_refresh'),

    # User
    path('me/',            MeView.as_view(),            name='me'),

    # Dashboard
    path('dashboard/',     DashboardView.as_view(),     name='dashboard'),

    # Accounts
    path('accounts/',               AccountListView.as_view(),   name='account-list'),
    path('accounts/<uuid:pk>/',     AccountDetailView.as_view(), name='account-detail'),

    # Transactions
    path('transactions/',           TransactionListView.as_view(), name='transaction-list'),

    # Operations
    path('deposit/',    DepositView.as_view(),   name='deposit'),
    path('withdraw/',   WithdrawView.as_view(),  name='withdraw'),
    path('transfer/',   TransferView.as_view(),  name='transfer'),

    # Notifications
    path('notifications/',          NotificationListView.as_view(),          name='notification-list'),
    path('notifications/<int:pk>/', MarkNotificationReadView.as_view(),      name='notification-read'),

    # Fees
    path('fees/',                   FeeStructureListView.as_view(),          name='fee-list'),
]