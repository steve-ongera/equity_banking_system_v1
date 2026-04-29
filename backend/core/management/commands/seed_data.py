"""
EquiBank Seed Command — 6 months of realistic Kenyan banking data
Usage: python manage.py seed_data
       python manage.py seed_data --clear   (wipe first)
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction as db_transaction

from core.models import User, Account, Transaction, FeeStructure, Notification


# ─── Kenyan names ─────────────────────────────────────────────────────────────

FIRST_NAMES_M = [
    "Brian", "Kevin", "Dennis", "Ian", "Victor", "Eric", "Felix", "George",
    "James", "John", "Michael", "Patrick", "Peter", "Robert", "Samuel",
    "Simon", "Stephen", "Thomas", "William", "David", "Daniel", "Emmanuel",
    "Francis", "Gilbert", "Harrison", "Isaac", "Joseph", "Kenneth", "Lawrence",
]
FIRST_NAMES_F = [
    "Aisha", "Amina", "Caroline", "Christine", "Diana", "Elizabeth", "Faith",
    "Grace", "Hannah", "Jane", "Joyce", "Judith", "Lucy", "Mary", "Mercy",
    "Nancy", "Pauline", "Priscilla", "Rose", "Ruth", "Sarah", "Sharon",
    "Susan", "Wanjiru", "Wambui", "Wairimu", "Njeri", "Nyambura", "Muthoni",
]
LAST_NAMES = [
    "Kamau", "Mwangi", "Ochieng", "Otieno", "Omondi", "Kipchoge", "Koech",
    "Mutua", "Njoroge", "Kariuki", "Gitau", "Waweru", "Maina", "Kimani",
    "Ngugi", "Mugo", "Ndungu", "Gacheru", "Gatheru", "Karanja", "Kinuthia",
    "Macharia", "Muiruri", "Mureithi", "Muriithi", "Murimi", "Mwenda",
    "Njenga", "Njuguna", "Nyaga", "Nyambura", "Wangeci", "Wanjiku",
    "Achieng", "Adhiambo", "Akumu", "Aoko", "Awino", "Onyango", "Owuor",
    "Chebet", "Chepkemoi", "Cheptoo", "Jelimo", "Jepkoech", "Keter", "Kirui",
]

KENYAN_TOWNS = [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Kitale",
    "Malindi", "Garissa", "Kakamega", "Nyeri", "Meru", "Embu", "Kericho",
]

# Realistic Kenyan transaction descriptions
DEPOSIT_DESCRIPTIONS = [
    "MPESA deposit - {ref}",
    "Salary credit - {month}",
    "Business income",
    "Freelance payment",
    "Cash deposit at branch",
    "RTGS transfer receipt",
    "Airtel Money deposit",
    "T-Kash deposit",
    "Dividend payment",
    "Rental income",
    "Commission payment",
    "Bonus payment - {month}",
    "Loan disbursement",
    "Insurance refund",
    "Tax refund KRA",
    "Agricultural payment",
    "Jua kali income",
]

WITHDRAWAL_DESCRIPTIONS = [
    "ATM withdrawal - {town} branch",
    "MPESA send money",
    "Utility payment - KPLC",
    "Utility payment - Nairobi Water",
    "Rent payment",
    "School fees payment",
    "Hospital bill",
    "Groceries - Naivas",
    "Groceries - Quickmart",
    "Fuel - Total Energies",
    "Fuel - Rubis",
    "Supermarket - Carrefour",
    "Insurance premium",
    "Loan repayment",
    "NHIF contribution",
    "NSSF contribution",
    "Cable TV - DStv",
    "Internet - Safaricom Home",
    "Airtime purchase",
    "Matatu fare top-up",
]

TRANSFER_DESCRIPTIONS = [
    "Chama contribution",
    "Family support",
    "Business payment to {name}",
    "Rent to landlord",
    "Split bill - restaurant",
    "Group savings",
    "Merry-go-round payment",
    "Supplier payment",
    "Freelancer payment",
    "Emergency transfer",
    "Wedding contribution",
    "Fundraiser contribution",
]

MONTHS_KE = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


class Command(BaseCommand):
    help = "Seed 6 months of realistic Kenyan banking data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear", action="store_true",
            help="Delete all existing data before seeding",
        )
        parser.add_argument(
            "--users", type=int, default=12,
            help="Number of customer accounts to create (default: 12)",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("⚠  Clearing existing data…"))
            Notification.objects.all().delete()
            Transaction.objects.all().delete()
            Account.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS("✓  Cleared.\n"))

        self.stdout.write(self.style.MIGRATE_HEADING("═" * 55))
        self.stdout.write(self.style.MIGRATE_HEADING("  EquiBank — Kenyan Seed Data"))
        self.stdout.write(self.style.MIGRATE_HEADING("═" * 55))

        # ── 1. Fee structures ───────────────────────────────────────────
        self._seed_fees()

        # ── 2. Users ────────────────────────────────────────────────────
        users = self._seed_users(options["users"])

        # ── 3. Extra accounts for some users ────────────────────────────
        self._seed_extra_accounts(users)

        # ── 4. Six months of transactions ───────────────────────────────
        self._seed_transactions(users)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("✅  Seed complete!\n"))
        self.stdout.write(f"   Users created : {len(users)}")
        self.stdout.write(f"   Password      : password123  (all users)")
        self.stdout.write(f"   Transactions  : {Transaction.objects.count()}")
        self.stdout.write(f"   Notifications : {Notification.objects.count()}")
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("  Accounts:"))
        for u in users[:5]:
            acc = u.accounts.first()
            self.stdout.write(
                f"   {u.username:<20} {acc.account_number}  "
                f"KES {acc.balance:>12,.2f}  ({acc.account_type})"
            )
        self.stdout.write("   … and more")
        self.stdout.write("")

    # ──────────────────────────────────────────────────────────────────────────
    #  Helpers
    # ──────────────────────────────────────────────────────────────────────────

    def _seed_fees(self):
        fees = [
            dict(transaction_type="DEPOSIT",    flat_fee=Decimal("0"),
                 percentage_fee=Decimal("0.005"), min_fee=Decimal("5"),   max_fee=Decimal("500")),
            dict(transaction_type="WITHDRAWAL", flat_fee=Decimal("30"),
                 percentage_fee=Decimal("0.01"),  min_fee=Decimal("30"),  max_fee=Decimal("1000")),
            dict(transaction_type="TRANSFER",   flat_fee=Decimal("0"),
                 percentage_fee=Decimal("0.015"), min_fee=Decimal("20"),  max_fee=Decimal("2000")),
        ]
        for f in fees:
            obj, created = FeeStructure.objects.update_or_create(
                transaction_type=f["transaction_type"], defaults=f
            )
            verb = "Created" if created else "Updated"
            self.stdout.write(f"  {verb} fee: {obj.transaction_type}")
        self.stdout.write("")

    def _seed_users(self, count):
        self.stdout.write(self.style.MIGRATE_HEADING(f"  Creating {count} users…"))
        users = []
        used_usernames = set(User.objects.values_list("username", flat=True))

        # Predefined realistic Kenyan profiles
        profiles = [
            ("brian",    "Brian",    "Kamau",    "0712345678", "M"),
            ("wanjiku",  "Wanjiku",  "Mwangi",   "0723456789", "F"),
            ("otieno",   "Kevin",    "Otieno",   "0734567890", "M"),
            ("aisha",    "Aisha",    "Omondi",   "0745678901", "F"),
            ("kipchoge", "Dennis",   "Kipchoge", "0756789012", "M"),
            ("njeri",    "Njeri",    "Kariuki",  "0767890123", "F"),
            ("mutua",    "Victor",   "Mutua",    "0778901234", "M"),
            ("grace",    "Grace",    "Ngugi",    "0789012345", "F"),
            ("ochieng",  "James",    "Ochieng",  "0790123456", "M"),
            ("muthoni",  "Muthoni",  "Gitau",    "0701234567", "F"),
            ("koech",    "Patrick",  "Koech",    "0711234567", "M"),
            ("wairimu",  "Wairimu",  "Njoroge",  "0722234567", "F"),
            ("samuel",   "Samuel",   "Waweru",   "0733234567", "M"),
            ("diana",    "Diana",    "Adhiambo", "0744234567", "F"),
            ("gilbert",  "Gilbert",  "Kirui",    "0755234567", "M"),
            ("faith",    "Faith",    "Chebet",   "0766234567", "F"),
        ]

        for i in range(count):
            if i < len(profiles):
                uname, first, last, phone, gender = profiles[i]
            else:
                gender = random.choice(["M", "F"])
                first  = random.choice(FIRST_NAMES_M if gender == "M" else FIRST_NAMES_F)
                last   = random.choice(LAST_NAMES)
                uname  = f"{first.lower()}{last.lower()[:4]}{random.randint(1,99)}"

            # Ensure uniqueness
            base = uname
            suffix = 1
            while uname in used_usernames:
                uname = f"{base}{suffix}"
                suffix += 1
            used_usernames.add(uname)

            email  = f"{uname}@equibank.ke"
            phone  = profiles[i][3] if i < len(profiles) else f"07{random.randint(10000000,99999999)}"

            # Random DOB: age 22–55
            dob = (timezone.now() - timedelta(
                days=random.randint(22*365, 55*365)
            )).date()

            user = User.objects.create_user(
                username     = uname,
                email        = email,
                password     = "password123",
                first_name   = first,
                last_name    = last,
                phone_number = phone,
                date_of_birth= dob,
                is_verified  = random.random() > 0.2,  # 80% verified
            )

            # Auto savings account created; set opening balance
            acc = Account.objects.filter(user=user, account_type="SAVINGS").first()
            if not acc:
                acc = Account.objects.create(user=user, account_type="SAVINGS")

            users.append(user)
            self.stdout.write(f"  ✓ {user.get_full_name():<24} (@{user.username})")

        self.stdout.write("")
        return users

    def _seed_extra_accounts(self, users):
        self.stdout.write(self.style.MIGRATE_HEADING("  Adding extra accounts…"))
        # Give ~40% of users a current account; ~20% a fixed deposit
        for user in users:
            if random.random() < 0.4:
                Account.objects.create(user=user, account_type="CURRENT",
                                       minimum_balance=Decimal("1000"))
                self.stdout.write(f"  + CURRENT for {user.username}")
            if random.random() < 0.2:
                Account.objects.create(user=user, account_type="FIXED")
                self.stdout.write(f"  + FIXED   for {user.username}")
        self.stdout.write("")

    def _seed_transactions(self, users):
        self.stdout.write(self.style.MIGRATE_HEADING("  Generating 6 months of transactions…"))

        fee_deposit    = FeeStructure.objects.get(transaction_type="DEPOSIT")
        fee_withdrawal = FeeStructure.objects.get(transaction_type="WITHDRAWAL")
        fee_transfer   = FeeStructure.objects.get(transaction_type="TRANSFER")

        now   = timezone.now()
        start = now - timedelta(days=183)  # ~6 months

        all_accounts = list(Account.objects.filter(user__in=users, status="ACTIVE"))

        # Give every account an initial deposit to start
        for acc in all_accounts:
            opening = Decimal(str(random.randint(5_000, 80_000)))
            self._do_deposit(
                acc, opening, fee_deposit,
                "Opening balance — cash deposit",
                start + timedelta(hours=random.randint(1, 12)),
            )

        # Generate activity day by day
        total_days = 183
        for day_offset in range(total_days):
            day = start + timedelta(days=day_offset)
            month_name = MONTHS_KE[day.month - 1]

            for user in users:
                accounts = [a for a in all_accounts if a.user_id == user.id]
                if not accounts:
                    continue

                primary = accounts[0]

                # ── Salary on 25th–28th ──────────────────────────────
                if day.day in (25, 26, 27, 28) and random.random() < 0.5:
                    salary = Decimal(str(random.randint(25_000, 180_000)))
                    self._do_deposit(
                        primary, salary, fee_deposit,
                        f"Salary credit - {month_name}",
                        day.replace(hour=random.randint(7, 10),
                                    minute=random.randint(0, 59)),
                    )

                # ── MPESA top-ups: 2–4×/week ─────────────────────────
                if day.weekday() in (0, 2, 4) and random.random() < 0.55:
                    amt = Decimal(str(random.choice([
                        500, 1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000
                    ])))
                    ref = f"{''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', k=10))}"
                    self._do_deposit(
                        primary, amt, fee_deposit,
                        f"MPESA deposit - {ref}",
                        day.replace(hour=random.randint(8, 21),
                                    minute=random.randint(0, 59)),
                    )

                # ── Withdrawals: 1–3×/week ───────────────────────────
                if random.random() < 0.45:
                    town = random.choice(KENYAN_TOWNS)
                    desc = random.choice(WITHDRAWAL_DESCRIPTIONS).format(
                        town=town, month=month_name
                    )
                    max_w = float(primary.balance) * 0.25
                    if max_w > 500:
                        amt = Decimal(str(round(random.uniform(300, min(max_w, 15_000)), -1)))
                        self._do_withdrawal(primary, amt, fee_withdrawal, desc, day.replace(
                            hour=random.randint(8, 18), minute=random.randint(0, 59)
                        ))

                # ── Transfers between users: ~2×/week ────────────────
                if day.weekday() in (1, 3, 5) and random.random() < 0.35:
                    other_accs = [a for a in all_accounts
                                  if a.user_id != user.id and a.account_type == "SAVINGS"]
                    if other_accs:
                        to_acc = random.choice(other_accs)
                        max_t  = float(primary.balance) * 0.15
                        if max_t > 200:
                            amt  = Decimal(str(round(random.uniform(200, min(max_t, 20_000)), -1)))
                            other_name = to_acc.user.get_full_name()
                            desc = random.choice(TRANSFER_DESCRIPTIONS).format(name=other_name)
                            self._do_transfer(
                                primary, to_acc, amt, fee_transfer, desc,
                                day.replace(hour=random.randint(9, 20),
                                            minute=random.randint(0, 59)),
                            )

                # ── Chama / merry-go-round on 1st & 15th ─────────────
                if day.day in (1, 15) and random.random() < 0.6:
                    other_accs = [a for a in all_accounts if a.user_id != user.id]
                    if other_accs and primary.balance > 2000:
                        to_acc = random.choice(other_accs)
                        amt    = Decimal(str(random.choice([1000, 1500, 2000, 2500, 3000, 5000])))
                        self._do_transfer(
                            primary, to_acc, amt, fee_transfer,
                            "Chama contribution",
                            day.replace(hour=random.randint(10, 14),
                                        minute=random.randint(0, 59)),
                        )

                # ── Current account top-up ────────────────────────────
                if len(accounts) > 1 and day.day == 1 and random.random() < 0.7:
                    current = next((a for a in accounts if a.account_type == "CURRENT"), None)
                    if current and primary.balance > 10_000:
                        amt = Decimal(str(random.randint(5_000, 30_000)))
                        self._do_transfer(
                            primary, current, amt, fee_transfer,
                            "Account top-up",
                            day.replace(hour=9, minute=0),
                        )

            # Progress indicator every 30 days
            if day_offset % 30 == 0:
                done = int((day_offset / total_days) * 20)
                bar  = "█" * done + "░" * (20 - done)
                pct  = int((day_offset / total_days) * 100)
                self.stdout.write(f"  [{bar}] {pct}%  —  {day.strftime('%b %Y')}")

        self.stdout.write(f"  [{'█'*20}] 100%  — Done")
        self.stdout.write("")

    # ──────────────────────────────────────────────────────────────────────────
    #  Atomic transaction writers (bypass serializer for speed + custom dates)
    # ──────────────────────────────────────────────────────────────────────────

    def _do_deposit(self, account, amount, fee_struct, description, ts):
        fee = fee_struct.calculate_fee(amount)
        net = amount - fee
        if net <= 0:
            return

        with db_transaction.atomic():
            account.refresh_from_db()
            bal_before      = account.balance
            account.balance += net
            account.save(update_fields=["balance"])

            txn = Transaction(
                account          = account,
                transaction_type = "DEPOSIT",
                amount           = amount,
                fee              = fee,
                balance_before   = bal_before,
                balance_after    = account.balance,
                description      = description,
                status           = "COMPLETED",
                completed_at     = ts,
            )
            txn.save()

            # Back-date created_at
            Transaction.objects.filter(pk=txn.pk).update(created_at=ts)

            Notification.objects.create(
                user    = account.user,
                title   = "Deposit Received",
                message = (
                    f"KES {amount:,.2f} credited to {account.account_number}. "
                    f"Fee: KES {fee:,.2f}. Balance: KES {account.balance:,.2f}."
                ),
                ntype   = "TRANSACTION",
            )
            Notification.objects.filter(
                user=account.user
            ).order_by("-id").first()
            # Back-date notification too
            Notification.objects.filter(
                user=account.user
            ).order_by("-id").update(created_at=ts)

    def _do_withdrawal(self, account, amount, fee_struct, description, ts):
        fee   = fee_struct.calculate_fee(amount)
        total = amount + fee

        account.refresh_from_db()
        if account.balance - total < account.minimum_balance:
            return  # skip if insufficient

        with db_transaction.atomic():
            account.refresh_from_db()
            if account.balance - total < account.minimum_balance:
                return
            bal_before      = account.balance
            account.balance -= total
            account.save(update_fields=["balance"])

            txn = Transaction(
                account          = account,
                transaction_type = "WITHDRAWAL",
                amount           = amount,
                fee              = fee,
                balance_before   = bal_before,
                balance_after    = account.balance,
                description      = description,
                status           = "COMPLETED",
                completed_at     = ts,
            )
            txn.save()
            Transaction.objects.filter(pk=txn.pk).update(created_at=ts)

            Notification.objects.create(
                user    = account.user,
                title   = "Withdrawal Processed",
                message = (
                    f"KES {amount:,.2f} withdrawn from {account.account_number}. "
                    f"Fee: KES {fee:,.2f}. Balance: KES {account.balance:,.2f}."
                ),
                ntype   = "TRANSACTION",
            )
            Notification.objects.filter(
                user=account.user
            ).order_by("-id").update(created_at=ts)

    def _do_transfer(self, from_acc, to_acc, amount, fee_struct, description, ts):
        fee   = fee_struct.calculate_fee(amount)
        total = amount + fee

        from_acc.refresh_from_db()
        if from_acc.balance - total < from_acc.minimum_balance:
            return

        with db_transaction.atomic():
            from_acc.refresh_from_db()
            to_acc.refresh_from_db()
            if from_acc.balance - total < from_acc.minimum_balance:
                return

            # Debit sender
            bal_from_before  = from_acc.balance
            from_acc.balance -= total
            from_acc.save(update_fields=["balance"])

            debit = Transaction(
                account          = from_acc,
                transaction_type = "TRANSFER",
                amount           = amount,
                fee              = fee,
                balance_before   = bal_from_before,
                balance_after    = from_acc.balance,
                description      = f"{description} → {to_acc.account_number}",
                related_account  = to_acc,
                status           = "COMPLETED",
                completed_at     = ts,
            )
            debit.save()
            Transaction.objects.filter(pk=debit.pk).update(created_at=ts)

            # Credit receiver
            bal_to_before  = to_acc.balance
            to_acc.balance += amount
            to_acc.save(update_fields=["balance"])

            credit = Transaction(
                account          = to_acc,
                transaction_type = "TRANSFER",
                amount           = amount,
                fee              = Decimal("0"),
                balance_before   = bal_to_before,
                balance_after    = to_acc.balance,
                description      = f"{description} ← {from_acc.account_number}",
                related_account  = from_acc,
                status           = "COMPLETED",
                completed_at     = ts,
            )
            credit.save()
            Transaction.objects.filter(pk=credit.pk).update(created_at=ts)

            # Notifications
            Notification.objects.create(
                user    = from_acc.user,
                title   = "Transfer Sent",
                message = (
                    f"KES {amount:,.2f} sent to {to_acc.user.get_full_name()} "
                    f"({to_acc.account_number}). Fee: KES {fee:,.2f}."
                ),
                ntype   = "TRANSACTION",
            )
            Notification.objects.filter(
                user=from_acc.user
            ).order_by("-id").update(created_at=ts)

            Notification.objects.create(
                user    = to_acc.user,
                title   = "Transfer Received",
                message = (
                    f"KES {amount:,.2f} received from "
                    f"{from_acc.user.get_full_name()} ({from_acc.account_number})."
                ),
                ntype   = "TRANSACTION",
            )
            Notification.objects.filter(
                user=to_acc.user
            ).order_by("-id").update(created_at=ts)