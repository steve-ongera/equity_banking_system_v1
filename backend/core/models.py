from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


class User(AbstractUser):
    """Extended user model with banking profile."""
    phone_number = models.CharField(max_length=20, blank=True)
    national_id  = models.CharField(max_length=20, unique=True, null=True, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_verified  = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.get_full_name()})"


class Account(models.Model):
    ACCOUNT_TYPES = [
        ('SAVINGS',  'Savings Account'),
        ('CURRENT',  'Current Account'),
        ('FIXED',    'Fixed Deposit'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE',    'Active'),
        ('SUSPENDED', 'Suspended'),
        ('CLOSED',    'Closed'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    account_number  = models.CharField(max_length=20, unique=True)
    account_type    = models.CharField(max_length=10, choices=ACCOUNT_TYPES, default='SAVINGS')
    balance         = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    currency        = models.CharField(max_length=3, default='KES')
    status          = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    minimum_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'

    def __str__(self):
        return f"{self.account_number} — {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.account_number:
            self.account_number = self._generate_account_number()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_account_number():
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(12)])


class FeeStructure(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT',    'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER',   'Transfer'),
    ]

    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPES, unique=True)
    flat_fee         = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    percentage_fee   = models.DecimalField(max_digits=5, decimal_places=4, default=0.0000,
                                           help_text='e.g. 0.02 = 2%')
    min_fee          = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    max_fee          = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active        = models.BooleanField(default=True)

    class Meta:
        db_table = 'fee_structures'

    def calculate_fee(self, amount):
        fee = self.flat_fee + (amount * self.percentage_fee)
        fee = max(fee, self.min_fee)
        if self.max_fee:
            fee = min(fee, self.max_fee)
        return round(fee, 2)

    def __str__(self):
        return f"{self.transaction_type} fee"


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('DEPOSIT',    'Deposit'),
        ('WITHDRAWAL', 'Withdrawal'),
        ('TRANSFER',   'Transfer'),
        ('FEE',        'Fee'),
        ('REVERSAL',   'Reversal'),
    ]
    STATUS_CHOICES = [
        ('PENDING',   'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED',    'Failed'),
        ('REVERSED',  'Reversed'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference        = models.CharField(max_length=50, unique=True)
    account          = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPES)
    amount           = models.DecimalField(max_digits=15, decimal_places=2)
    fee              = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance_before   = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after    = models.DecimalField(max_digits=15, decimal_places=2)
    description      = models.TextField(blank=True)
    related_account  = models.ForeignKey(Account, on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='incoming_transactions')
    status           = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at       = models.DateTimeField(auto_now_add=True)
    completed_at     = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} | {self.transaction_type} | {self.amount}"

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = self._generate_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_reference():
        import random, string
        prefix = 'EQB'
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        return f"{prefix}{suffix}"


class Notification(models.Model):
    TYPES = [
        ('TRANSACTION', 'Transaction'),
        ('SECURITY',    'Security'),
        ('PROMO',       'Promotion'),
        ('SYSTEM',      'System'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title      = models.CharField(max_length=255)
    message    = models.TextField()
    ntype      = models.CharField(max_length=15, choices=TYPES, default='SYSTEM')
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} — {self.title}"