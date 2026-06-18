/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  Layout,
  FileText,
  Users,
  Settings,
  Database,
  Search,
  Globe,
  LogIn,
  RefreshCw,
  LogOut,
  FolderLock
} from 'lucide-react';
import Navbar from './components/Navbar';
import AdminDashboard from './components/AdminDashboard';
import PageBuilder from './components/PageBuilder';
import ContentManager from './components/ContentManager';
import UserAccounts from './components/UserAccounts';
import PublicWebsite from './components/PublicWebsite';
import { User, DashboardStats, AuditLog, XMLRecord } from './types';

export default function App() {
  // Session States
  const [token, setToken] = useState<string | null>(localStorage.getItem('bfa_jwt_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Toggles
  const [currentTab, setTab] = useState<'public' | 'admin'>('public');
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'pages' | 'content' | 'users'>('dashboard');

  // Login Form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // App Statistics & SQLite Logs
  const [stats, setStats] = useState<DashboardStats>({
    totalPages: 0,
    totalNews: 0,
    totalGallery: 0,
    totalPrograms: 0,
    totalCoaches: 0,
    totalSponsors: 0,
    totalEvents: 0,
    totalVisitors: 0,
    totalFiles: 0
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search Engine state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ collection: string; record: XMLRecord }> | null>(null);

  // Load active session user if token is present
  const checkSession = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        // Clear stale token
        handleLocalLogout();
      }
    } catch {
      handleLocalLogout();
    }
  };

  // Fetch KPI counters
  const fetchDashboardStats = async () => {
    try {
      const sRes = await fetch('/api/dashboard/stats');
      const statsJson = await sRes.json();
      setStats(statsJson);

      // Audits logs only accessible to privileged roles
      if (token && currentUser && ['Super Admin', 'Admin'].includes(currentUser.role)) {
        const aRes = await fetch('/api/audit-logs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const auditJson = await aRes.json();
        if (auditJson.logs) {
          setAuditLogs(auditJson.logs);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil metrik dashboard:', err);
    }
  };

  useEffect(() => {
    checkSession();
  }, [token]);

  useEffect(() => {
    fetchDashboardStats();
  }, [currentUser, token]);

  const handleLocalLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('bfa_jwt_token');
    setTab('public');
  };

  // Handle Login submitting
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return;

    setLoginError('');
    setIsLoadingAuth(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginUser,
          password: loginPass
        })
      });

      const data = await res.json();

      if (data.error) {
        setLoginError(data.error);
      } else {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('bfa_jwt_token', data.token);
        setTab('admin');
        setAdminSubTab('dashboard');
        // Clear form
        setLoginUser('');
        setLoginPass('');
      }
    } catch (err: any) {
      setLoginError('Koneksi server terputus: ' + err.message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Logout trigger
  const handleLogoutAction = async () => {
    if (!token) return;
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch {
      // Ignore network failures for logout
    }
    handleLocalLogout();
  };

  // Trigger global search query
  const handleSearchTrigger = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Single-click login seed helpers for quick-testing inside visual preview iframe!
  const useDemoCredential = (user: string) => {
    setLoginUser(user);
    setLoginPass('password123');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* GLOBAL NAVBAR HEADER */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogoutAction}
        currentTab={currentTab}
        setTab={setTab}
        onSearch={handleSearchTrigger}
        onNavigateToSlug={(slug) => {
          setSearchResults(null);
        }}
      />

      {/* RENDER VIEW SWITCHERS */}
      {currentTab === 'public' ? (
        
        /* 1. PUBLIC WEBSITE PORTAL VIEW */
        <PublicWebsite
          searchResults={searchResults}
          onClearSearch={() => setSearchResults(null)}
          onSelectAdminTab={() => setTab('admin')}
        />

      ) : (

        /* 2. ADMIN PORTAL VIEW WITH AUTHENTICATION GUARD */
        <div className="flex-grow flex flex-col pt-0">
          
          {!currentUser ? (
            
            /* SECURE ENTERPRISE LOGIN SCREEN WITH DEMO PRESETS */
            <div className="flex-grow flex items-center justify-center p-4 py-16">
              <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden text-left sm:max-w-lg">
                
                {/* Header branding */}
                <div className="bg-brand-primary p-6 text-white text-center space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary text-brand-primary font-bold mx-auto text-xl shadow-md">
                    BFA
                  </div>
                  <div>
                    <h3 className="font-display text-md font-bold uppercase tracking-wider">Otentikasi Portal Admin</h3>
                    <p className="text-[11px] text-gray-300">BFA CMS Enterprise XML Edition - 100% Secure Localhost DB</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-6 space-y-6">
                  {loginError && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-750 border border-red-200">
                      ⚠️ {loginError}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Username Login</label>
                      <input
                        type="text"
                        required
                        placeholder="superadmin / admin / editor / coach / marketing"
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        className="w-full rounded-md border border-gray-200 p-3 outline-none focus:ring-1 focus:ring-brand-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Kata Sandi (Password)</label>
                      <input
                        type="password"
                        required
                        placeholder="******"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        className="w-full rounded-md border border-gray-200 p-3 outline-none focus:ring-1 focus:ring-brand-secondary font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoadingAuth}
                      className="w-full rounded-lg bg-brand-primary py-3 text-xs font-bold text-white shadow hover:bg-brand-primary/95 transition flex items-center justify-center"
                    >
                      {isLoadingAuth ? 'Menverifikasi Kredensial...' : 'Masuk Log Admin'}
                    </button>
                  </form>

                  {/* HIGH-FIDELITY TESTING PRESETS FOR PREVIEW WORK-FLOW (ASSETS ACCORDING TO SYSTEM RULES) */}
                  <div className="border-t pt-5 text-xs text-left">
                    <span className="flex items-center text-[10px] uppercase font-bold text-brand-secondary">
                      <FolderLock className="h-4.5 w-4.5 mr-1" />
                      Templat Uji Coba Cepat (Double Click)
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                      Gunakan akun ber-otentikasi SQLite default di bawah untuk menguji pembatasan otentikasi role-level secara instan (Sandi: <code>password123</code>):
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-center text-[10px] sm:grid-cols-3">
                      <button
                        onClick={() => useDemoCredential('superadmin')}
                        className="bg-gray-100 hover:bg-brand-primary hover:text-white p-2 rounded font-mono font-bold text-gray-700 transition"
                      >
                        Super Admin
                      </button>
                      <button
                        onClick={() => useDemoCredential('admin')}
                        className="bg-gray-100 hover:bg-brand-primary hover:text-white p-2 rounded font-mono font-bold text-gray-700 transition"
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => useDemoCredential('editor')}
                        className="bg-gray-100 hover:bg-brand-primary hover:text-white p-2 rounded font-mono font-bold text-gray-700 transition"
                      >
                        Editor (XML)
                      </button>
                      <button
                        onClick={() => useDemoCredential('coach')}
                        className="bg-gray-100 hover:bg-brand-primary hover:text-white p-2 rounded font-mono font-bold text-gray-700 transition"
                      >
                        Coach (Pelatih)
                      </button>
                      <button
                        onClick={() => useDemoCredential('marketing')}
                        className="bg-gray-100 hover:bg-brand-primary hover:text-white p-2 rounded font-mono font-bold text-gray-700 transition"
                      >
                        Marketing
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          ) : (

            /* DOUBLE-SIDE CONSOLE PANEL WRAPPER */
            <div className="flex-grow flex flex-col md:flex-row shadow-inner">
              
              {/* SIDEBAR CONSOLE SYSTEM */}
              <aside className="w-full md:w-64 bg-white border-r border-gray-205 flex flex-col p-4 space-y-1 justify-between text-left shrink-0">
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Navigasi Admin Console</span>
                  </div>

                  <nav className="space-y-1">
                    {[
                      { key: 'dashboard', label: 'Monitor Dashboard', icon: Layout },
                      { key: 'pages', label: 'Page Builder (Notion)', icon: FileText },
                      { key: 'content', label: 'Koleksi Database Content', icon: Database },
                      { key: 'users', label: 'Manajemen Akun & Role', icon: Users }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setAdminSubTab(tab.key as any)}
                          className={`w-full flex items-center space-x-2.5 rounded-lg px-4.5 py-3 text-xs font-semibold whitespace-nowrap transition ${
                            adminSubTab === tab.key
                              ? 'bg-brand-primary text-white shadow-sm'
                              : 'text-gray-600 hover:text-brand-primary hover:bg-blue-50/10'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Footer anchor session user */}
                <div className="border-t border-gray-150 pt-4 space-y-3">
                  <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl">
                    <div className="h-8 w-8 rounded-full bg-brand-secondary text-brand-primary font-bold text-xs flex items-center justify-center">
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-[10px] leading-tight">
                      <p className="font-bold text-[#0B1F3A]">{currentUser.username}</p>
                      <p className="text-gray-405 font-mono">{currentUser.role}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogoutAction}
                    className="w-full border rounded-lg px-3 py-2 text-xs font-semibold text-red-500 border-red-200 bg-red-50/20 hover:bg-red-55 hover:text-white transition flex items-center justify-center space-x-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>LOGOUT SESI</span>
                  </button>
                </div>

              </aside>

              {/* CORE DASHBOARD SCRIPT CONTAINER */}
              <div className="flex-grow p-6 bg-slate-50 max-h-[calc(100vh-120px)] overflow-y-auto">
                <main className="max-w-7xl mx-auto">
                  {adminSubTab === 'dashboard' && (
                    <AdminDashboard
                      currentUser={currentUser}
                      stats={stats}
                      auditLogs={auditLogs}
                      onRefreshStats={fetchDashboardStats}
                      token={token}
                    />
                  )}

                  {adminSubTab === 'pages' && (
                    <PageBuilder
                      token={token}
                      onRefreshStats={fetchDashboardStats}
                    />
                  )}

                  {adminSubTab === 'content' && (
                    <ContentManager
                      token={token}
                      currentUser={currentUser}
                      onRefreshStats={fetchDashboardStats}
                    />
                  )}

                  {adminSubTab === 'users' && (
                    <UserAccounts
                      token={token}
                      currentUser={currentUser}
                      onRefreshStats={fetchDashboardStats}
                    />
                  )}
                </main>
              </div>

            </div>

          )}

        </div>

      )}

    </div>
  );
}
