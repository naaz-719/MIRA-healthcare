import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, PlusCircle, Menu, X,
  Activity, Heart, ChevronRight
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/patients', label: 'All Patients', icon: Users },
  { to: '/patients/new', label: 'New Patient', icon: PlusCircle },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Heart size={20} fill="white" color="white" />
          </div>
          <div className="logo-text">
            <span className="logo-main">MIRA</span>
            <span className="logo-sub">Health Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Navigation</p>
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-badge">
            <Activity size={14} />
            <span>AI-Powered Analysis</span>
          </div>
          <p className="sidebar-version">MIRA v1.0.0</p>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-right">
            <div className="topbar-badge">
              <span className="pulse-dot" />
              System Online
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
