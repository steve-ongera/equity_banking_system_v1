import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout        from './components/Layout';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import Dashboard     from './pages/Dashboard';
import Accounts      from './pages/Accounts';
import Transactions  from './pages/Transactions';
import Deposit       from './pages/Deposit';
import Withdraw      from './pages/Withdraw';
import Transfer      from './pages/Transfer';
import Reports       from './pages/Reports';
import Profile       from './pages/Profile';
import MiniStatement from './pages/MiniStatement';
import Security      from './pages/Security';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', gap:10 }}>
      <i className="bi bi-arrow-repeat spin" style={{ fontSize:'1.6rem', color:'var(--green)' }} />
      <span style={{ color:'var(--muted)', fontFamily:'var(--font-head)' }}>Loading…</span>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index                  element={<Dashboard />} />
            <Route path="accounts"        element={<Accounts />} />
            <Route path="transactions"    element={<Transactions />} />
            <Route path="deposit"         element={<Deposit />} />
            <Route path="withdraw"        element={<Withdraw />} />
            <Route path="transfer"        element={<Transfer />} />
            <Route path="reports"         element={<Reports />} />
            <Route path="profile"         element={<Profile />} />
            <Route path="mini-statement"  element={<MiniStatement />} />
            <Route path="security"        element={<Security />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}