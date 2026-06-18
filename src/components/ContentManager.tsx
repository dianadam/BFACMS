/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Image as ImageIcon,
  Award,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Link2,
  Trash2,
  Plus,
  Save,
  Grid,
  FileDown,
  ChevronRight,
  UploadCloud,
  FileText,
  Search,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { XMLRecord, MenuItem, User } from '../types';

interface ContentManagerProps {
  token: string | null;
  currentUser: User;
  onRefreshStats: () => void;
}

type ActiveSubModule =
  | 'news'
  | 'gallery'
  | 'programs'
  | 'coaches'
  | 'sponsors'
  | 'events'
  | 'testimonials'
  | 'menus'
  | 'media';

export default function ContentManager({ token, currentUser, onRefreshStats }: ContentManagerProps) {
  const [activeModule, setActiveModule] = useState<ActiveSubModule>('news');
  const [records, setRecords] = useState<XMLRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Editor Modal states
  const [selectedRecord, setSelectedRecord] = useState<Partial<XMLRecord> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Menu states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newMenuLabel, setNewMenuLabel] = useState('');
  const [newMenuUrl, setNewMenuUrl] = useState('');

  // Media upload files state
  const [mediaFiles, setMediaFiles] = useState<XMLRecord[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [dragActive, setDragActive] = useState(false);

  // Fetch target module records
  const fetchRecords = async (col: string) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/cms/${col}`);
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
      }
    } catch (err: any) {
      setError(`Gagal memuat XML koleksi ${col}: ` + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch menus
  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menus');
      const data = await res.json();
      if (data.menus) {
        setMenuItems(data.menus);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch media library
  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.files) {
        setMediaFiles(data.files);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeModule === 'menus') {
      fetchMenus();
    } else if (activeModule === 'media') {
      fetchMedia();
    } else {
      fetchRecords(activeModule);
    }
  }, [activeModule]);

  const handleCreateNew = () => {
    const baseNew: Partial<XMLRecord> = {
      id: '',
      title: '',
      slug: '',
      description: '',
      content: '',
      image: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80',
      status: 'published'
    };

    // Add module-specific attributes
    if (activeModule === 'news') {
      baseNew.category = 'Artikel';
    } else if (activeModule === 'programs') {
      baseNew.price = 'Rp 1.000.000 / Bulan';
      baseNew.duration = '3 Sesi per Minggu';
      baseNew.coach_id = '';
    } else if (activeModule === 'coaches') {
      baseNew.specialty = 'Professional Coach';
      baseNew.instagram = '@instagram_id';
    } else if (activeModule === 'sponsors') {
      baseNew.website = 'https://mitra-sponsor.id';
      baseNew.level = 'Silver Sponsor';
    } else if (activeModule === 'events') {
      baseNew.event_date = '2026-07-01T10:00';
      baseNew.location = 'Stadium Utama';
    } else if (activeModule === 'testimonials') {
      baseNew.testimonial_author = 'Nama Pengguna';
      baseNew.testimonial_role = 'Mitra Bisnis / Orangtua';
    }

    setSelectedRecord(baseNew);
  };

  const handleEditRecord = (rec: XMLRecord) => {
    setSelectedRecord({ ...rec });
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !selectedRecord.title) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/cms/${activeModule}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedRecord)
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Konten XML berhasil disimpan & dimodifikasi!');
        setSelectedRecord(null);
        onRefreshStats();
        fetchRecords(activeModule);
      }
    } catch (err: any) {
      setError('Kesalahan koneksi: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus konten XML ini secara permanen?')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cms/${activeModule}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Konten XML berhasil dihapus dari repositori!');
        onRefreshStats();
        fetchRecords(activeModule);
      }
    } catch (err: any) {
      setError('Gagal menghapus data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- MENU BUILDER LOGIC ---
  const handleAddMenuItem = () => {
    if (!newMenuLabel) return;
    const item: MenuItem = {
      id: 'menu_' + Math.random().toString(36).substring(2, 9),
      label: newMenuLabel,
      url: newMenuUrl || '#',
      order: menuItems.length + 1
    };
    const updated = [...menuItems, item];
    setMenuItems(updated);
    setNewMenuLabel('');
    setNewMenuUrl('');
  };

  const handleDeleteMenuItem = (id: string) => {
    const filtered = menuItems.filter(m => m.id !== id);
    // Recalculate orders
    const sorted = filtered.map((m, idx) => ({ ...m, order: idx + 1 }));
    setMenuItems(sorted);
  };

  const handleSaveMenuLayout = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ menus: menuItems })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Struktur Menu Utama (menus.xml) berhasil di-update!');
        onRefreshStats();
        fetchMenus();
      }
    } catch (err: any) {
      setError('Gagal menyimpan menu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- MEDIA LIBRARY DRAG/DROP & ACTIONS ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('File berhasil diunggah dan diregister di documents.xml!');
        onRefreshStats();
        fetchMedia();
      }
    } catch (err: any) {
      setError('Gagal mengunggah berkas: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!window.confirm('Hapus lampiran media ini dari server? File fisik akan dihapus.')) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Media lampiran berhasil didelete!');
        onRefreshStats();
        fetchMedia();
      }
    } catch (err: any) {
      setError('Gagal delete media: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = mediaFiles.filter((m) => {
    if (mediaFilter === 'all') return true;
    return m.content === mediaFilter; // content stores images / videos / documents
  });

  return (
    <div className="space-y-6">
      
      {/* Sub-modules navigation segment */}
      <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 overflow-x-auto gap-1">
        {[
          { key: 'news', label: 'News & Artikel', icon: Newspaper },
          { key: 'gallery', label: 'Foto Galeri', icon: ImageIcon },
          { key: 'programs', label: 'Program Olahraga', icon: Award },
          { key: 'coaches', label: 'Pelatih & Coach', icon: Users },
          { key: 'events', label: 'Event Lomba', icon: Calendar },
          { key: 'testimonials', label: 'Testimoni', icon: Sparkles },
          { key: 'sponsors', label: 'Sponsor Mitra', icon: Layers },
          { key: 'menus', label: 'Menu Builder (XML)', icon: ChevronRight },
          { key: 'media', label: 'Media Library (Disk)', icon: UploadCloud }
        ].map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.key}
              onClick={() => {
                setActiveModule(mod.key as ActiveSubModule);
                setSelectedRecord(null);
              }}
              className={`flex items-center space-x-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all ${
                activeModule === mod.key
                  ? 'bg-brand-primary text-white shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-brand-primary hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* State status overlays */}
      {message && (
        <div className="rounded-lg bg-green-50 p-3.5 text-xs text-green-700 border border-green-200 text-left">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-3.5 text-xs text-red-700 border border-red-200 text-left">
          {error}
        </div>
      )}

      {/* --- RENDER MEDIA LIBRARY SECTION --- */}
      {activeModule === 'media' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 text-left">
          
          {/* Uploader section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="font-display text-sm font-bold text-brand-primary uppercase">Unggah File Media Baru</h4>
            <p className="text-xs text-gray-400">File akan ter-kategorisasi otomatis berdasarkan ekstensi file.</p>

            {/* Drag & Drop Canvas */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-4 py-12 text-center cursor-pointer transition ${
                dragActive ? 'border-brand-secondary bg-blue-50/20' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-xs text-gray-600 font-semibold">Tarik & Jatuhkan berkas di sini</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Mendukung Gambar, pdf, excel, word, video</p>

              <label className="mt-4 inline-flex items-center rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm cursor-pointer hover:bg-brand-primary/90">
                Pilih Berkas Manual
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="bg-[#00AEEF]/5 border border-[#00AEEF] p-3 rounded-lg">
              <span className="text-[10px] font-bold text-brand-primary uppercase">PORTABILITAS PENYIMPANAN:</span>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                File fisik disimpan di sub-direktori <code>/uploads/*</code> dan meta di <code>documents.xml</code>.
              </p>
            </div>
          </div>

          {/* Media Grid lists */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
              <h4 className="font-display text-sm font-bold text-brand-primary uppercase">Arsip Berkas Unggahan</h4>
              
              {/* Media filtering tabs */}
              <div className="flex border rounded-lg bg-gray-50 p-0.5 text-[10px] font-bold">
                <button onClick={() => setMediaFilter('all')} className={`px-2 py-1 rounded ${mediaFilter === 'all' ? 'bg-brand-primary text-white shadow' : 'text-gray-500'}`}>Semua</button>
                <button onClick={() => setMediaFilter('images')} className={`px-2 py-1 rounded ${mediaFilter === 'images' ? 'bg-brand-primary text-white shadow' : 'text-gray-500'}`}>Gambar</button>
                <button onClick={() => setMediaFilter('videos')} className={`px-2 py-1 rounded ${mediaFilter === 'videos' ? 'bg-brand-primary text-white shadow' : 'text-gray-500'}`}>Videos</button>
                <button onClick={() => setMediaFilter('documents')} className={`px-2 py-1 rounded ${mediaFilter === 'documents' ? 'bg-brand-primary text-white shadow' : 'text-gray-500'}`}>Dokumen</button>
              </div>
            </div>

            {filteredMedia.length === 0 ? (
              <div className="py-24 text-center text-gray-400">
                Belum ada berkas media tersimpan untuk kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredMedia.map((media) => {
                  const isImg = media.media_type === 'image';
                  const isVid = media.media_type === 'video';

                  return (
                    <div key={media.id} className="group relative rounded-lg border bg-gray-50 p-2 overflow-hidden flex flex-col justify-between">
                      {/* Image Thumbnails preview */}
                      <div className="h-28 w-full rounded-md bg-stone-100 flex items-center justify-center overflow-hidden mb-2 border border-gray-150">
                        {isImg ? (
                          <img
                            src={media.image}
                            alt={media.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover group-hover:scale-105 transition"
                          />
                        ) : isVid ? (
                          <div className="text-center p-2">
                            <VideoPlayer src={media.image} />
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-brand-primary flex flex-col items-center">
                            <FileText className="h-6 w-6 text-brand-secondary mb-1" />
                            {media.document_type?.toUpperCase() || 'FILE'}
                          </span>
                        )}
                      </div>

                      {/* Header metadata descriptors */}
                      <div className="space-y-1.5 text-left">
                        <p className="text-[11px] font-bold text-gray-800 line-clamp-1 truncate" title={media.title}>
                          {media.title}
                        </p>
                        <p className="text-[9px] font-mono text-gray-400 capitalize bg-white px-1.5 py-0.5 rounded border border-gray-100 inline-block">
                          {media.content}
                        </p>
                      </div>

                      {/* Hover action bars */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <button
                          onClick={() => copyToClipboard(media.image)}
                          className="p-1 rounded bg-white border border-gray-100 text-gray-500 hover:text-brand-secondary inline-flex items-center gap-1 text-[9px]"
                          title="Salin Path URL"
                        >
                          {copiedId === media.image ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>SALIN</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteMedia(media.id)}
                          className="p-1 rounded bg-white border border-red-100 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* --- RENDER MENU BUILDER MODULE --- */}
      {activeModule === 'menus' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 text-left">
          
          {/* Menu Adder Column */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h4 className="font-display text-sm font-bold text-brand-primary uppercase">Tambah Slot Menu Baru</h4>
            <p className="text-xs text-gray-400">Dandani rancangan sitemap anda. Setiap jalur item menu akan tersimpan di XML.</p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Label Menu</label>
                <input
                  type="text"
                  placeholder="Contoh: Galeri Foto"
                  value={newMenuLabel}
                  onChange={(e) => setNewMenuLabel(e.target.value)}
                  className="w-full text-xs rounded border border-gray-200 p-2"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Alamat Target (URL / Slug)</label>
                <input
                  type="text"
                  placeholder="Contoh: /gallery ATAU /halaman-kustom"
                  value={newMenuUrl}
                  onChange={(e) => setNewMenuUrl(e.target.value)}
                  className="w-full text-xs rounded border border-gray-200 p-2 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMenuItem}
                className="w-full rounded bg-brand-primary py-2 text-xs font-bold text-white shadow hover:bg-brand-primary/95"
              >
                + Masukkan ke Diagram Menu
              </button>
            </div>
          </div>

          {/* Menus Interactive Grid */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-display text-sm font-bold text-brand-primary uppercase">Struktur Aktif Menu Builder</h4>
              <button
                onClick={handleSaveMenuLayout}
                className="inline-flex items-center space-x-1 border border-[#00AEEF] px-4 py-1.5 text-xs font-bold text-brand-secondary bg-blue-50/20 rounded hover:bg-[#00AEEF] hover:text-white transition"
              >
                <Save className="h-4 w-4" />
                <span>Simpan dan Push Menu</span>
              </button>
            </div>

            {menuItems.length === 0 ? (
              <div className="py-24 text-center text-gray-400">
                Menu kosong. Daftarkan menu baru di kolom sebelah kiri.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto shadow-inner bg-slate-50 border p-3 rounded-lg">
                {menuItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between bg-white border rounded-lg p-3 shadow-xs">
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white font-mono text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-gray-800">{item.label}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{item.url}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 leading-normal">
              Urutan di atas dapat ditata otomatis berdasarkan input order dari list XML collection.
            </p>
          </div>

        </div>
      )}

      {/* --- STANDARD SCHEMATIC LIST CRUD VIEW --- */}
      {activeModule !== 'menus' && activeModule !== 'media' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 text-left">
          
          {/* Module Action header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-brand-primary uppercase flex items-center">
                <span>Kelola {activeModule.toUpperCase()} Repository XML</span>
              </h3>
              <p className="text-xs text-gray-400">Manipulasi baris entries XML untuk modul yang aktif di atas.</p>
            </div>

            <button
              onClick={handleCreateNew}
              className="inline-flex items-center space-x-1.5 rounded bg-brand-primary px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-brand-primary/95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Entri Baru</span>
            </button>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/50 border-b text-[10px] font-bold uppercase tracking-wider font-mono text-gray-500">
                  <th className="p-3 w-16">ID/Slug</th>
                  <th className="p-3">Judul Utama</th>
                  <th className="p-3">Deskripsi Singkat</th>
                  {activeModule === 'news' && <th className="p-3">Kategori</th>}
                  {activeModule === 'programs' && <th className="p-3">Biaya/Sesi</th>}
                  {activeModule === 'coaches' && <th className="p-3">Keahlian</th>}
                  {activeModule === 'events' && <th className="p-3">Tanggal & Tempat</th>}
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Navigasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-400">
                      Belum ada database baris yang terarsip di dalam {activeModule}.xml. Hubungi Administrator untuk seeding atau klik + Daftarkan Entri Baru.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-mono text-gray-400">
                        <span className="block truncate w-24" title={rec.id}>{rec.slug || rec.id}</span>
                      </td>
                      <td className="p-3 font-bold text-brand-primary">{rec.title}</td>
                      <td className="p-3 text-gray-500 truncate max-w-xs">{rec.description}</td>
                      
                      {activeModule === 'news' && <td className="p-3 text-blue-600 font-semibold">{rec.category || 'Berita'}</td>}
                      {activeModule === 'programs' && (
                        <td className="p-3 font-mono">
                          <span className="block text-green-700 font-semibold">{rec.price}</span>
                          <span className="block text-[10px] text-gray-400">{rec.duration}</span>
                        </td>
                      )}
                      {activeModule === 'coaches' && <td className="p-3 font-semibold text-purple-700">{rec.specialty}</td>}
                      {activeModule === 'events' && (
                        <td className="p-3">
                          <span className="block font-semibold text-amber-700">{rec.location}</span>
                          <span className="block text-[10px] text-gray-400 font-mono">{rec.event_date ? new Date(rec.event_date).toLocaleString('id-ID') : '-'}</span>
                        </td>
                      )}

                      <td className="p-3">
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${rec.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {rec.status}
                        </span>
                      </td>

                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEditRecord(rec)}
                          className="px-2.5 py-1 bg-gray-100 text-brand-primary hover:bg-brand-primary hover:text-white rounded font-semibold text-[10px]"
                        >
                          SUNTING
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-red-500 rounded hover:bg-red-50 inline-flex align-middle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- FORM MODAL FOR MODULE ADD/EDIT --- */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden animate-fade-in text-left">
            
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                {selectedRecord.id ? 'Edit Data Entri XML' : 'Tambah Data Entri Baru XML'}
              </h3>
              <p className="text-[11px] text-gray-300 mt-0.5">Semua data secara otomatis dikompresi ke text XML tag berstandar internasional.</p>
            </div>

            {/* Core Form */}
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 max-h-[500px] overflow-y-auto text-xs">
              
              {/* Common Title/Slug */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Judul / Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={selectedRecord.title || ''}
                    onChange={(e) => setSelectedRecord({
                      ...selectedRecord,
                      title: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    })}
                    className="w-full rounded border p-2 outline-none focus:ring-1 focus:ring-brand-secondary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Slug URL</label>
                  <input
                    type="text"
                    required
                    value={selectedRecord.slug || ''}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, slug: e.target.value })}
                    className="w-full rounded border p-2 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Common Desr/Caption Image */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Deskripsi Singkat / Ringkasan</label>
                <input
                  type="text"
                  value={selectedRecord.description || ''}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, description: e.target.value })}
                  className="w-full rounded border p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Banner Gambar / Avatar (URL)</label>
                <input
                  type="text"
                  value={selectedRecord.image || ''}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, image: e.target.value })}
                  className="w-full rounded border p-2 font-mono"
                  placeholder="https://..."
                />
              </div>

              {/* --- DYNAMIC MODULE FIELDS --- */}
              {activeModule === 'news' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kategori Berita</label>
                  <select
                    value={selectedRecord.category || 'Artikel'}
                    onChange={(e) => setSelectedRecord({ ...selectedRecord, category: e.target.value })}
                    className="w-full rounded border p-2 bg-white"
                  >
                    <option value="Artikel">Artikel Kesehatan</option>
                    <option value="Berita">Rilis Berita</option>
                    <option value="Prestasi">Prestasi & Kompetisi</option>
                    <option value="Event">Aktivitas Internal</option>
                  </select>
                </div>
              )}

              {activeModule === 'programs' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fee / Biaya Kepelatihan</label>
                    <input
                      type="text"
                      value={selectedRecord.price || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, price: e.target.value })}
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Durasi / Berapa Sesi</label>
                    <input
                      type="text"
                      value={selectedRecord.duration || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, duration: e.target.value })}
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
              )}

              {activeModule === 'coaches' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Spesialisasi Cabang</label>
                    <input
                      type="text"
                      value={selectedRecord.specialty || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, specialty: e.target.value })}
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Instagram (@ID)</label>
                    <input
                      type="text"
                      value={selectedRecord.instagram || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, instagram: e.target.value })}
                      className="w-full rounded border p-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {activeModule === 'sponsors' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Website Sponsor</label>
                    <input
                      type="text"
                      value={selectedRecord.website || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, website: e.target.value })}
                      className="w-full rounded border p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tingkatan Kemitraan (Level)</label>
                    <input
                      type="text"
                      value={selectedRecord.level || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, level: e.target.value })}
                      className="w-full rounded border p-2"
                      placeholder="Gold Sponsor, Silver, dst"
                    />
                  </div>
                </div>
              )}

              {activeModule === 'events' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lokasi Stadium / Tempat</label>
                    <input
                      type="text"
                      value={selectedRecord.location || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, location: e.target.value })}
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Waktu Pelaksanaan</label>
                    <input
                      type="datetime-local"
                      value={selectedRecord.event_date || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, event_date: e.target.value })}
                      className="w-full rounded border p-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {activeModule === 'testimonials' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Penemu/Penulis</label>
                    <input
                      type="text"
                      value={selectedRecord.testimonial_author || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, testimonial_author: e.target.value })}
                      className="w-full rounded border p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Jabatan / Hubungan</label>
                    <input
                      type="text"
                      value={selectedRecord.testimonial_role || ''}
                      onChange={(e) => setSelectedRecord({ ...selectedRecord, testimonial_role: e.target.value })}
                      className="w-full rounded border p-2"
                    />
                  </div>
                </div>
              )}

              {/* Main Content Body */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Isi Konten Utama / Biografi</label>
                <textarea
                  rows={5}
                  value={selectedRecord.content || ''}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, content: e.target.value })}
                  className="w-full rounded border p-2.5 outline-none"
                  placeholder="Isi rincian perihal berita, program latihan, biografi coach..."
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status Publikasi</label>
                <select
                  value={selectedRecord.status || 'published'}
                  onChange={(e) => setSelectedRecord({ ...selectedRecord, status: e.target.value as any })}
                  className="w-full rounded border p-2 bg-white"
                >
                  <option value="published">🚀 Published (Tampilkan di Situs)</option>
                  <option value="draft">📁 Draft (Sembunyikan Sementara)</option>
                </select>
              </div>

              {/* Actions buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-md bg-brand-primary px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B1F3A]/90"
                >
                  {isLoading ? 'Menulis ke XML...' : 'SIMPAN KE REPOS'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded-md border border-gray-200 px-5 py-2 text-[11px] text-gray-500 hover:bg-gray-50"
                >
                  BATAL
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Small subcomponents representing dynamic media formats inside preview modal
function VideoPlayer({ src }: { src: string }) {
  return (
    <video className="rounded border shadow-sm max-h-20" controls muted playsInline>
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}
