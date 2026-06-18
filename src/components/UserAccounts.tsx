/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Users, Trash2, Key, Mail, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserAccountsProps {
  token: string | null;
  currentUser: User;
  onRefreshStats: () => void;
}

export default function UserAccounts({ token, currentUser, onRefreshStats }: UserAccountsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Registrar forms
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Editor');

  const loadUsersList = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      setError('Gagal memuat daftar user akun dari SQLite: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, [token]);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role
        })
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage(`Berhasil mendaftarkan akun editor/staf baru: ${username} (${role})`);
        onRefreshStats();
        setUsername('');
        setEmail('');
        setPassword('');
        loadUsersList();
      }
    } catch (err: any) {
      setError('Gagal registrasi akun: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser.id) {
      alert('Anda tidak bisa mendelete akun sesi aktif Anda sendiri!');
      return;
    }
    if (!window.confirm(`Hapus permanen akun user: ${name}?`)) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Akun user berhasil dihapus dari SQLite auth!');
        onRefreshStats();
        loadUsersList();
      }
    } catch (err: any) {
      setError('Gagal menghapus user: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isRestricted = currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin';

  if (isRestricted) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center max-w-xl mx-auto text-stone-800 text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-55 text-red-700 mx-auto border mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="font-display text-md font-bold text-brand-primary uppercase">Hak Akses Terbatas</h3>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Mohon maaf, konfigurasi pendaftaran staf, otentikasi login, dan role-pemisahan hanya dapat dimodifikasi oleh pengguna dengan jabatan <span className="font-bold text-brand-primary">Super Admin</span> atau <span className="font-bold text-brand-primary">Admin</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 text-left">
      
      {/* Dynamic Registrator layout */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h4 className="font-display text-sm font-bold text-brand-primary uppercase flex items-center space-x-1">
          <UserPlus className="h-4.5 w-4.5 text-brand-secondary" />
          <span>Registrasi Staff Baru</span>
        </h4>
        <p className="text-xs text-gray-400">Dafarkan kredensial login admin, editor, pembina marketing pangkalan baru.</p>

        {message && (
          <div className="rounded bg-green-50 p-2 text-[11px] text-green-700 border border-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded bg-red-50 p-2 text-[11px] text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegisterUser} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Username Login</label>
            <input
              type="text"
              required
              placeholder="Contoh: staff_marketing"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-xs rounded border border-gray-200 p-2.5 outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Surat Elektronik (Email)</label>
            <input
              type="email"
              required
              placeholder="contoh: marketing@bfa.cms"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs rounded border border-gray-200 p-2.5 outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Kata Sandi (Minimum 6)</label>
            <input
              type="password"
              required
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs rounded border border-gray-200 p-2.5 outline-none focus:ring-1 focus:ring-brand-secondary font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Role / Jabatan Sistem</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full text-xs rounded border border-gray-200 p-2.5 bg-white"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Coach">Coach (Pelatih)</option>
              <option value="Marketing">Marketing Staff</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-brand-primary py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0B1F3A]/90 transition"
          >
            {isLoading ? 'Mendaftarkan Akun...' : 'Daftarkan Pengguna Baru'}
          </button>
        </form>
      </div>

      {/* Database Listing Column */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
        <h4 className="font-display text-sm font-bold text-brand-primary uppercase flex items-center space-x-1">
          <Users className="h-4.5 w-4.5 text-brand-secondary" />
          <span>Daftar User SQLite (Active Members)</span>
        </h4>
        <p className="text-xs text-gray-400">Total data otentikasi login yang tersimpan permanen di <code>/database/auth.db</code>.</p>

        <div className="overflow-x-auto border rounded-xl bg-white shadow-inner max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b font-mono font-bold text-[10px] uppercase text-gray-400">
                <th className="p-3">Nama Pengguna</th>
                <th className="p-3">Alamat Email</th>
                <th className="p-3">Jabatan (Role)</th>
                <th className="p-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-gray-50/55 transition">
                  <td className="p-3">
                    <span className="font-bold text-brand-primary">{usr.username}</span>
                  </td>
                  <td className="p-3 text-gray-500 font-mono text-[11px]">{usr.email}</td>
                  <td className="p-3">
                    <span className="font-mono text-[10px] uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-brand-secondary font-bold">
                      {usr.role}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(usr.id, usr.username)}
                      disabled={usr.id === currentUser.id}
                      className={`p-1 rounded ${usr.id === currentUser.id ? 'text-gray-300 pointer-events-none' : 'text-red-500 hover:bg-red-50'}`}
                      title={usr.id === currentUser.id ? 'Sesi Aktif' : 'Hapus user staf'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150 text-[10px] text-gray-500 flex items-start space-x-2">
          <Info className="h-4.5 w-4.5 text-[#00AEEF] flex-shrink-0 mt-0.5" />
          <span>
            Setiap pendaftaran baru diverifikasi secara real-time dan direkam ke dalam jurnal SQLite log audit untuk keperluan kepatuhan data administratif.
          </span>
        </div>
      </div>

    </div>
  );
}
