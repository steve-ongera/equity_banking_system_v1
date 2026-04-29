# EquiBank — Full Stack Banking System

## Project Structure
```
equibank/
├── backend/              # Django REST API
│   ├── core/             # Single Django app
│   │   ├── models.py     # User, Account, Transaction, FeeStructure, Notification
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── apps.py
│   ├── equibank/         # Django project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── seed.py           # Run to seed fee structures
│   └── requirements.txt
│
└── frontend/             # React + Vite
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx        # Routes
        ├── index.css      # Global CSS vars & utilities
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   └── api.js     # Axios + JWT auto-refresh
        ├── components/
        │   ├── Navbar.jsx / .css
        │   ├── Sidebar.jsx / .css
        │   ├── Layout.jsx / .css
        │   ├── StatCard.jsx / .css
        │   ├── TxnTable.jsx / .css
        │   ├── FormCard.jsx / .css
        │   ├── Card.jsx / .css
        │   ├── Button.jsx / .css
        │   ├── FormInput.jsx / .css
        │   └── TransactionRow.jsx / .css
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── AuthPage.css
            ├── Dashboard.jsx / .css
            ├── Accounts.jsx / .css
            ├── Transactions.jsx / .css
            ├── Deposit.jsx
            ├── Withdraw.jsx
            ├── Transfer.jsx
            └── OperationPage.css
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser
python manage.py shell < seed.py   # Seeds fee structures
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:3000
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | Login → JWT tokens |
| POST | /api/auth/register/ | Register new user |
| POST | /api/auth/refresh/ | Refresh access token |
| GET | /api/me/ | Current user profile |
| GET | /api/dashboard/ | Dashboard summary |
| GET | /api/accounts/ | List user accounts |
| GET | /api/transactions/ | Transaction history |
| POST | /api/deposit/ | Deposit funds |
| POST | /api/withdraw/ | Withdraw funds |
| POST | /api/transfer/ | Transfer to another account |
| GET | /api/notifications/ | User notifications |
| GET | /api/fees/ | Active fee structures |

## Fee Structure (seeded defaults)
| Type | Flat | % | Min | Max |
|------|------|---|-----|-----|
| Deposit | 0 | 0.5% | KES 5 | KES 500 |
| Withdrawal | KES 30 | 1% | KES 30 | KES 1,000 |
| Transfer | 0 | 1.5% | KES 20 | KES 2,000 |

## Features
- JWT auth with auto-refresh
- Auto savings account on registration
- Configurable fee structures via admin
- Real-time balance updates
- Transaction history with filtering
- In-app notifications (created on every transaction)
- Responsive sidebar + navbar
- Dark green banking theme