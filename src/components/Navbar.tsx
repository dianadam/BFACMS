/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Search, Globe, LogOut, Layout, User as UserIcon, BookOpen } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  currentTab: 'public' | 'admin';
  setTab: (tab: 'public' | 'admin') => void;
  onSearch: (query: string) => void;
  onNavigateToSlug?: (slug: string) => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  currentTab,
  setTab,
  onSearch,
  onNavigateToSlug
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white text-slate-800 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setTab('public'); if (onNavigateToSlug) onNavigateToSlug('home'); }}>
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#0B1F3A] text-white font-bold shadow-xs font-display text-lg">
            BFA
          </div>
          <div>
            <h1 className="font-display text-sm font-bold tracking-tight text-[#0B1F3A] sm:text-base">
              BFA ENTERPRISE <span className="text-[10px] text-[#00AEEF] font-mono ml-1 px-1.5 py-0.5 rounded bg-slate-100">XML</span>
            </h1>
            <p className="hidden text-[10px] text-slate-400 uppercase tracking-wider font-semibold sm:block">XML CMS Edition</p>
          </div>
        </div>

        {/* Dynamic Global Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative mx-4 hidden max-w-xs flex-1 sm:block">
          <input
            type="text"
            placeholder="Search XML records..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full rounded-full bg-slate-100 py-1.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 border border-transparent outline-none transition-all focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-300"
          />
          <Search className="absolute top-2.5 left-3.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </form>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setTab('public'); if (onNavigateToSlug) onNavigateToSlug('home'); }}
            className={`flex items-center space-x-1.5 rounded px-3 py-1.5 text-xs font-semibold tracking-tight transition-colors ${
              currentTab === 'public'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-slate-650 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">Website Publik</span>
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => setTab('admin')}
                className={`flex items-center space-x-1.5 rounded px-3 py-1.5 text-xs font-semibold tracking-tight transition-colors ${
                  currentTab === 'admin'
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'text-slate-653 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="hidden md:inline">Console Admin</span>
              </button>

              <div className="hidden items-center space-x-2 border-l border-slate-200 pl-3 md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <p className="font-bold text-slate-800 leading-tight">{currentUser.username}</p>
                  <p className="text-[10px] text-[#00AEEF] font-mono leading-none tracking-wider font-semibold uppercase">{currentUser.role}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setTab('admin')}
              className="flex items-center space-x-1.5 rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Shield className="h-4 w-4 text-[#00AEEF]" />
              <span>Login Admin</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
