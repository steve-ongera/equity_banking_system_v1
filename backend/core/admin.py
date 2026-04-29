from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Account, Transaction, FeeStructure, Notification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['username', 'email', 'get_full_name', 'is_verified', 'created_at']
    list_filter   = ['is_verified', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets     = BaseUserAdmin.fieldsets + (
        ('Banking Profile', {'fields': ('phone_number', 'national_id', 'date_of_birth', 'is_verified')}),
    )


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display  = ['account_number', 'user', 'account_type', 'balance', 'currency', 'status']
    list_filter   = ['account_type', 'status', 'currency']
    search_fields = ['account_number', 'user__username']
    readonly_fields = ['id', 'account_number', 'created_at', 'updated_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ['reference', 'account', 'transaction_type', 'amount', 'fee', 'status', 'created_at']
    list_filter   = ['transaction_type', 'status']
    search_fields = ['reference', 'account__account_number']
    readonly_fields = ['id', 'reference', 'created_at']


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['transaction_type', 'flat_fee', 'percentage_fee', 'min_fee', 'max_fee', 'is_active']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'ntype', 'is_read', 'created_at']
    list_filter  = ['ntype', 'is_read']