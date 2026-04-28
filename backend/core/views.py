from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import Account, Transaction, Notification, FeeStructure
from .serializers import (
    CustomTokenObtainPairSerializer, RegisterSerializer,
    UserSerializer, AccountSerializer, TransactionSerializer,
    DepositSerializer, WithdrawalSerializer, TransferSerializer,
    NotificationSerializer, FeeStructureSerializer,
)

User = get_user_model()


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


# ─── User / Profile ──────────────────────────────────────────────────────────

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─── Accounts ────────────────────────────────────────────────────────────────

class AccountListView(generics.ListAPIView):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


class AccountDetailView(generics.RetrieveAPIView):
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


# ─── Transactions ─────────────────────────────────────────────────────────────

class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        account_ids = Account.objects.filter(user=self.request.user).values_list('id', flat=True)
        qs = Transaction.objects.filter(account_id__in=account_ids)

        # Optional filters
        txn_type = self.request.query_params.get('type')
        if txn_type:
            qs = qs.filter(transaction_type=txn_type.upper())

        account_id = self.request.query_params.get('account')
        if account_id:
            qs = qs.filter(account_id=account_id)

        return qs[:50]  # Latest 50


# ─── Operations ──────────────────────────────────────────────────────────────

class DepositView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = DepositSerializer(data=request.data, context={'request': request})
        if ser.is_valid():
            txn = ser.save()
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class WithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = WithdrawalSerializer(data=request.data, context={'request': request})
        if ser.is_valid():
            txn = ser.save()
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class TransferView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = TransferSerializer(data=request.data, context={'request': request})
        if ser.is_valid():
            txn = ser.save()
            return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Notifications ────────────────────────────────────────────────────────────

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)[:20]


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.is_read = True
            notif.save()
            return Response({'status': 'marked read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        """Mark all read."""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked read'})


# ─── Fee Structures (read-only for users) ─────────────────────────────────────

class FeeStructureListView(generics.ListAPIView):
    queryset = FeeStructure.objects.filter(is_active=True)
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated]


# ─── Dashboard Summary ────────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        accounts = Account.objects.filter(user=request.user)
        account_ids = accounts.values_list('id', flat=True)

        total_balance = sum(a.balance for a in accounts)
        recent_txns   = Transaction.objects.filter(account_id__in=account_ids)[:5]
        unread_notifs = Notification.objects.filter(user=request.user, is_read=False).count()

        return Response({
            'total_balance':        total_balance,
            'accounts':             AccountSerializer(accounts, many=True).data,
            'recent_transactions':  TransactionSerializer(recent_txns, many=True).data,
            'unread_notifications': unread_notifs,
        })