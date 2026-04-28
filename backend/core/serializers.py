from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.db import transaction as db_transaction
from django.utils import timezone
from decimal import Decimal

from .models import User, Account, Transaction, FeeStructure, Notification


# ─── Auth ───────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username']    = user.username
        token['full_name']   = user.get_full_name()
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'phone_number', 'national_id', 'date_of_birth',
                  'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Account.objects.create(user=user, account_type='SAVINGS')
        return user


# ─── User ────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'phone_number', 'national_id',
                  'date_of_birth', 'is_verified', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


# ─── Account ─────────────────────────────────────────────────────────────────

class AccountSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(source='user', read_only=True)

    class Meta:
        model  = Account
        fields = ['id', 'account_number', 'account_type', 'balance',
                  'currency', 'status', 'minimum_balance', 'owner',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'account_number', 'balance', 'created_at', 'updated_at']


# ─── Transaction ─────────────────────────────────────────────────────────────

class TransactionSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)
    related_account_number = serializers.CharField(
        source='related_account.account_number', read_only=True, default=None)

    class Meta:
        model  = Transaction
        fields = ['id', 'reference', 'account_number', 'transaction_type',
                  'amount', 'fee', 'balance_before', 'balance_after',
                  'description', 'related_account_number', 'status',
                  'created_at', 'completed_at']
        read_only_fields = fields


# ─── Operations ──────────────────────────────────────────────────────────────

class DepositSerializer(serializers.Serializer):
    account_id  = serializers.UUIDField()
    amount      = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('1'))
    description = serializers.CharField(max_length=255, required=False, default='Deposit')

    def validate_account_id(self, value):
        try:
            account = Account.objects.get(id=value, status='ACTIVE')
        except Account.DoesNotExist:
            raise serializers.ValidationError('Active account not found.')
        self.context['account'] = account
        return value

    def save(self):
        account     = self.context['account']
        amount      = self.validated_data['amount']
        description = self.validated_data.get('description', 'Deposit')

        fee_struct = FeeStructure.objects.filter(transaction_type='DEPOSIT', is_active=True).first()
        fee        = fee_struct.calculate_fee(amount) if fee_struct else Decimal('0')

        with db_transaction.atomic():
            bal_before       = account.balance
            account.balance += (amount - fee)
            account.save()

            txn = Transaction.objects.create(
                account=account, transaction_type='DEPOSIT',
                amount=amount, fee=fee,
                balance_before=bal_before, balance_after=account.balance,
                description=description, status='COMPLETED', completed_at=timezone.now(),
            )

            Notification.objects.create(
                user=account.user,
                title='Deposit Successful',
                message=f'KES {amount} deposited. Fee: KES {fee}. New balance: KES {account.balance}.',
                ntype='TRANSACTION',
            )
        return txn


class WithdrawalSerializer(serializers.Serializer):
    account_id  = serializers.UUIDField()
    amount      = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('1'))
    description = serializers.CharField(max_length=255, required=False, default='Withdrawal')

    def validate(self, attrs):
        try:
            account = Account.objects.get(id=attrs['account_id'], status='ACTIVE')
        except Account.DoesNotExist:
            raise serializers.ValidationError({'account_id': 'Active account not found.'})

        fee_struct = FeeStructure.objects.filter(transaction_type='WITHDRAWAL', is_active=True).first()
        fee        = fee_struct.calculate_fee(attrs['amount']) if fee_struct else Decimal('0')
        total      = attrs['amount'] + fee

        if account.balance - total < account.minimum_balance:
            raise serializers.ValidationError(
                {'amount': f'Insufficient funds. Available: {account.balance - account.minimum_balance}'})

        self.context['account'] = account
        self.context['fee']     = fee
        return attrs

    def save(self):
        account     = self.context['account']
        fee         = self.context['fee']
        amount      = self.validated_data['amount']
        description = self.validated_data.get('description', 'Withdrawal')

        with db_transaction.atomic():
            bal_before       = account.balance
            account.balance -= (amount + fee)
            account.save()

            txn = Transaction.objects.create(
                account=account, transaction_type='WITHDRAWAL',
                amount=amount, fee=fee,
                balance_before=bal_before, balance_after=account.balance,
                description=description, status='COMPLETED', completed_at=timezone.now(),
            )

            Notification.objects.create(
                user=account.user,
                title='Withdrawal Successful',
                message=f'KES {amount} withdrawn. Fee: KES {fee}. New balance: KES {account.balance}.',
                ntype='TRANSACTION',
            )
        return txn


class TransferSerializer(serializers.Serializer):
    from_account_id   = serializers.UUIDField()
    to_account_number = serializers.CharField(max_length=20)
    amount            = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('1'))
    description       = serializers.CharField(max_length=255, required=False, default='Transfer')

    def validate(self, attrs):
        try:
            from_acc = Account.objects.get(id=attrs['from_account_id'], status='ACTIVE')
        except Account.DoesNotExist:
            raise serializers.ValidationError({'from_account_id': 'Source account not found.'})

        try:
            to_acc = Account.objects.get(account_number=attrs['to_account_number'], status='ACTIVE')
        except Account.DoesNotExist:
            raise serializers.ValidationError({'to_account_number': 'Destination account not found.'})

        if from_acc.id == to_acc.id:
            raise serializers.ValidationError('Cannot transfer to the same account.')

        fee_struct = FeeStructure.objects.filter(transaction_type='TRANSFER', is_active=True).first()
        fee        = fee_struct.calculate_fee(attrs['amount']) if fee_struct else Decimal('0')
        total      = attrs['amount'] + fee

        if from_acc.balance - total < from_acc.minimum_balance:
            raise serializers.ValidationError(
                {'amount': f'Insufficient funds. Available: {from_acc.balance - from_acc.minimum_balance}'})

        self.context['from_acc'] = from_acc
        self.context['to_acc']   = to_acc
        self.context['fee']      = fee
        return attrs

    def save(self):
        from_acc    = self.context['from_acc']
        to_acc      = self.context['to_acc']
        fee         = self.context['fee']
        amount      = self.validated_data['amount']
        description = self.validated_data.get('description', 'Transfer')

        with db_transaction.atomic():
            bal_before_from   = from_acc.balance
            from_acc.balance -= (amount + fee)
            from_acc.save()

            debit_txn = Transaction.objects.create(
                account=from_acc, transaction_type='TRANSFER',
                amount=amount, fee=fee,
                balance_before=bal_before_from, balance_after=from_acc.balance,
                description=f'Transfer to {to_acc.account_number}: {description}',
                related_account=to_acc, status='COMPLETED', completed_at=timezone.now(),
            )

            bal_before_to   = to_acc.balance
            to_acc.balance += amount
            to_acc.save()

            Transaction.objects.create(
                account=to_acc, transaction_type='TRANSFER',
                amount=amount, fee=Decimal('0'),
                balance_before=bal_before_to, balance_after=to_acc.balance,
                description=f'Transfer from {from_acc.account_number}: {description}',
                related_account=from_acc, status='COMPLETED', completed_at=timezone.now(),
            )

            Notification.objects.create(
                user=from_acc.user, title='Transfer Sent',
                message=f'KES {amount} sent to {to_acc.account_number}. Fee: KES {fee}.',
                ntype='TRANSACTION',
            )
            Notification.objects.create(
                user=to_acc.user, title='Transfer Received',
                message=f'KES {amount} received from {from_acc.account_number}.',
                ntype='TRANSACTION',
            )

        return debit_txn


# ─── Notification ─────────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ['id', 'title', 'message', 'ntype', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeeStructure
        fields = '__all__'