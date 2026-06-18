/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Newspaper,
  Image as ImageIcon,
  Award,
  Users,
  Eye,
  FolderOpen,
  ArrowRight,
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  History
} from 'lucide-react';
import { User, AuditLog, DashboardStats } from '../types';

interface AdminDashboardProps {
  currentUser: User;
  stats: DashboardStats;
  auditLogs: AuditLog[];
  onRefreshStats: () => void;
  token: string | null;
}

export default function AdminDashboard({
  currentUser,
  stats,
  auditLogs,
  onRefreshStats,
  token
}: AdminDashboardProps) {
  const [activeLogTab, setActiveLogTab] = useState<'all' | 'Login' | 'Create_Update' | 'Delete'>('all');
  const [exportMessage, setExportMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>(auditLogs);

  useEffect(() => {
    setLogs(auditLogs);
  }, [auditLogs]);

  // Handle Backup XML Export
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/backup/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.error) {
        setErrorMessage(data.error);
        return;
      }

      // Convert snapshot to a downloadable JSON file representation
      const fileBlob = new Blob([JSON.stringify(data.backup, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `bfa_cms_backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportMessage('Cadangan database XML berhasil diekspor menjadi JSON!');
      onRefreshStats();
      setTimeout(() => setExportMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage('Gagal mengekspor data: ' + err.message);
    }
  };

  // Handle Backup XML Import
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = event.target?.result;
        if (!rawJson) return;

        const parsed = JSON.parse(String(rawJson));
        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ backup: parsed })
        });
        const data = await res.json();

        if (data.error) {
          setErrorMessage(data.error);
        } else {
          setExportMessage('Database XML berhasil dipulihkan (Restore) dari cadangan file!');
          onRefreshStats();
          setTimeout(() => setExportMessage(''), 5000);
        }
      } catch (err: any) {
        setErrorMessage('Gagal mengurai file cadangan: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Filtering audit logs based on tags
  const filteredLogs = logs.filter((log) => {
    if (activeLogTab === 'all') return true;
    if (activeLogTab === 'Login') return log.action === 'Login' || log.action === 'Logout';
    if (activeLogTab === 'Create_Update') return log.action === 'Create' || log.action === 'Update' || log.action === 'Publish';
    if (activeLogTab === 'Delete') return log.action === 'Delete';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex flex-col justify-between gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-brand-primary sm:text-3xl">
            Console Enterprise BFA CMS
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Selamat bekerja, <strong className="text-brand-primary">{currentUser.username}</strong> ({currentUser.role}). Sistem berjalan 100% lokal.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
            ● LOCAL HOST ONLINE
          </span>
          <span className="text-xs text-gray-500 font-mono">v1.2.0-XML</span>
        </div>
      </div>

      {/* Notifications banner */}
      {exportMessage && (
        <div className="flex items-center space-x-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto font-bold">✕</button>
        </div>
      )}

      {/* Grid of KPI Metrics Card */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        
        {/* Pages KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Halaman Pages</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1F3A]/10 text-brand-primary">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalPages}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Halaman XML yang di-index</p>
          </div>
        </div>

        {/* News KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Berita & Artikel</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AEEF]/10 text-brand-secondary">
              <Newspaper className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalNews}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Artikel berita aktif</p>
          </div>
        </div>

        {/* Programs KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Program Pembinaan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalPrograms}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Program olahraga & latihan</p>
          </div>
        </div>

        {/* Coaches KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pelatih Aktif</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalCoaches}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Instruktur profesional ter-xml</p>
          </div>
        </div>

        {/* Gallery KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Album Galeri</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <ImageIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalGallery}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Item foto & multimedia</p>
          </div>
        </div>

        {/* Media Library Files KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">File & Unggahan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <FolderOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalFiles}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Dokumen & LAMPIRAN</p>
          </div>
        </div>

        {/* Sponsors KPI */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor Mitra</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalSponsors}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Sponsor & Donatur Terhubung</p>
          </div>
        </div>

        {/* Visitors Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kunjungan Portal</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-display text-2xl font-bold text-brand-primary">{stats.totalVisitors}</h3>
            <p className="text-[11px] text-gray-400 mt-1">Hits server lokal ter-log</p>
          </div>
        </div>

      </div>

      {/* KPI analytical charts & Backup tool suite */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Dynamic customized SVG chart displaying contents weight */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h4 className="font-display text-sm font-semibold text-brand-primary uppercase tracking-wider flex items-center space-x-2">
            <Activity className="h-4 w-4 text-[#00AEEF]" />
            <span>Bobot Konten XML Repository (Distribusi)</span>
          </h4>
          <div className="mt-6 flex flex-col items-center">
            
            {/* Visual SVG Bar Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-48">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="#E5E7EB" strokeWidth="2" />

              {/* Data Bars */}
              {/* Total Pages (Navy) */}
              <rect x="70" y={170 - (stats.totalPages * 20)} width="40" height={stats.totalPages * 20 || 10} fill="#0B1F3A" rx="4" />
              <text x="90" y={160 - (stats.totalPages * 20)} textAnchor="middle" className="text-[9px] font-mono fill-brand-primary font-bold">{stats.totalPages}</text>
              <text x="90" y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-500">Pages</text>

              {/* Total News (Blue) */}
              <rect x="140" y={170 - (stats.totalNews * 25)} width="40" height={stats.totalNews * 25 || 10} fill="#00AEEF" rx="4" />
              <text x="160" y={160 - (stats.totalNews * 25)} textAnchor="middle" className="text-[9px] font-mono fill-brand-secondary font-bold">{stats.totalNews}</text>
              <text x="160" y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-500">Berita</text>

              {/* Programs (Yellow) */}
              <rect x="210" y={170 - (stats.totalPrograms * 30)} width="40" height={stats.totalPrograms * 30 || 10} fill="#F7C600" rx="4" />
              <text x="230" y={160 - (stats.totalPrograms * 30)} textAnchor="middle" className="text-[9px] font-mono fill-yellow-600 font-bold">{stats.totalPrograms}</text>
              <text x="230" y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-500">Program</text>

              {/* Coaches (Green) */}
              <rect x="280" y={170 - (stats.totalCoaches * 35)} width="40" height={stats.totalCoaches * 35 || 10} fill="#10B981" rx="4" />
              <text x="300" y={160 - (stats.totalCoaches * 35)} textAnchor="middle" className="text-[9px] font-mono fill-green-600 font-bold">{stats.totalCoaches}</text>
              <text x="300" y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-500">Pelatih</text>

              {/* Gallery (Purple) */}
              <rect x="350" y={170 - (stats.totalGallery * 25)} width="40" height={stats.totalGallery * 25 || 10} fill="#8B5CF6" rx="4" />
              <text x="370" y={160 - (stats.totalGallery * 25)} textAnchor="middle" className="text-[9px] font-mono fill-purple-600 font-bold">{stats.totalGallery}</text>
              <text x="370" y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-500">Galeri</text>

              {/* Documents (Teal) */}
              <rect x="420" y={170 - (stats.totalFiles * 25)} width="40" height={stats.totalFiles * 25 || 10} fill="#0D9488" rx="4" />
              <text x="440" y={160 - (stats.totalFiles * 25)} textAnchor="middle" className="text-[9px] font-mono fill-teal-600 font-bold">{stats.totalFiles}</text>
              <text x="440" y="185" textAnchor="middle" className="text-[10px] font-semibold fill-gray-500">Files</text>
            </svg>

            <span className="text-[10px] text-gray-400 mt-2">Diagram di-render secara dinamis berdasarkan kalkulasi tag baris di berkas XML.</span>
          </div>
        </div>

        {/* Portable XML Backup System Console Panel */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-left">
          <h4 className="font-display text-sm font-semibold text-brand-primary uppercase tracking-wider flex items-center space-x-2">
            <Database className="h-4 w-4 text-[#F7C600]" />
            <span>Sistem Cadangan & Portable</span>
          </h4>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            Karena BFA CMS adalah <span className="font-semibold text-brand-primary">100% Portable</span>, Anda dapat mengunduh seluruh isi database XML dalam format JSON tunggal, lalu memulihkannya langsung di mini-PC, flashdisk, atau server laptop lain.
          </p>

          <div className="mt-5 space-y-3">
            
            {/* Export */}
            <button
              onClick={handleExportBackup}
              className="flex w-full items-center justify-between rounded-lg bg-brand-primary px-4 py-3 text-xs font-semibold text-white shadow transition-colors hover:bg-brand-primary/90"
            >
              <span className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Ekspor Cadangan (.JSON)</span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Import Wrapper */}
            <label className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer transition-colors hover:bg-gray-100">
              <span className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-brand-secondary" />
                <span>Pulihkan Database (.JSON)</span>
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
              <span className="text-[10px] text-gray-400 bg-white border px-1.5 py-0.5 rounded shadow-sm">PILIH FILE</span>
            </label>

          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between text-xs font-mono text-gray-400">
              <span>LOKASI REPOSITORI:</span>
              <span className="text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">/data/*.xml</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 mt-2">
              <span>AUTH DATABASE:</span>
              <span className="text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">/database/auth.db</span>
            </div>
          </div>
        </div>

      </div>

      {/* Audit logs SQLite Database */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-gray-100 bg-gray-50/55 gap-4">
          <div>
            <h4 className="font-display text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center space-x-2">
              <History className="h-4 w-4 text-brand-secondary" />
              <span>Log Audit Keamanan (SQLite Engine)</span>
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">Seluruh perubahan taktis admin dicatat di dalam /database/auth.db secara permanen.</p>
          </div>

          {/* Filtering tabs */}
          <div className="flex bg-white border rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveLogTab('all')}
              className={`px-3 py-1 rounded-md transition-colors ${activeLogTab === 'all' ? 'bg-brand-primary text-white font-semibold' : 'text-gray-500 hover:text-brand-primary'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveLogTab('Login')}
              className={`px-3 py-1 rounded-md transition-colors ${activeLogTab === 'Login' ? 'bg-brand-primary text-white font-semibold' : 'text-gray-500 hover:text-brand-primary'}`}
            >
              Autentikasi
            </button>
            <button
              onClick={() => setActiveLogTab('Create_Update')}
              className={`px-3 py-1 rounded-md transition-colors ${activeLogTab === 'Create_Update' ? 'bg-brand-primary text-white font-semibold' : 'text-gray-500 hover:text-brand-primary'}`}
            >
              Manipulasi XML
            </button>
            <button
              onClick={() => setActiveLogTab('Delete')}
              className={`px-3 py-1 rounded-md transition-colors ${activeLogTab === 'Delete' ? 'bg-brand-primary text-white font-semibold' : 'text-gray-500 hover:text-brand-primary'}`}
            >
              Penghapusan
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-100/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-5 w-16">ID</th>
                <th className="py-3 px-4 w-44">TAMPIL WAKTU UTC</th>
                <th className="py-3 px-4 w-36">AKTOR (USER)</th>
                <th className="py-3 px-4 w-28">ROLE</th>
                <th className="py-3 px-4 w-28">AKSI</th>
                <th className="py-3 px-5">RINCIAN AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    Tidak ada aktivitas audit log yang terekam pada sesi ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let actColor = 'bg-blue-50 text-blue-700';
                  if (log.action === 'Login') actColor = 'bg-green-50 text-green-700';
                  if (log.action === 'Logout') actColor = 'bg-gray-100 text-gray-700';
                  if (log.action === 'Delete') actColor = 'bg-red-50 text-red-700';
                  if (log.action === 'Publish') actColor = 'bg-purple-100 text-purple-800';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-5 font-mono text-gray-400">#{log.id}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-primary">{log.username}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${actColor}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-gray-600 truncate max-w-sm" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
