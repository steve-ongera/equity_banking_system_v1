import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar  from './Navbar';
import './Layout.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="layout__main">
        <Navbar onMenuClick={() => setSidebarOpen(v => !v)} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}