/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layout,
  Heading,
  AlignLeft,
  Image,
  Video,
  MousePointer,
  Grid,
  Quote,
  Code,
  Sparkles,
  Save,
  FileText,
  Search,
  Eye,
  Settings,
  Globe
} from 'lucide-react';
import { PageBlock, XMLRecord, BlockType, SEOMeta } from '../types';

interface PageBuilderProps {
  token: string | null;
  onRefreshStats: () => void;
}

export default function PageBuilder({ token, onRefreshStats }: PageBuilderProps) {
  const [pages, setPages] = useState<XMLRecord[]>([]);
  const [selectedPage, setSelectedPage] = useState<XMLRecord | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  
  // SEO Meta state
  const [seoMeta, setSeoMeta] = useState<SEOMeta>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    openGraphImage: '',
    schemaMarkup: '{}'
  });

  // Editor states
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Page Creator state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Load all pages from XML
  const loadPages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cms/pages');
      const data = await res.json();
      if (data.records) {
        setPages(data.records);
        if (data.records.length > 0 && !selectedPage) {
          selectPage(data.records[0]);
        }
      }
    } catch (err: any) {
      setError('Gagal memuat daftar halaman XML: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const selectPage = (page: XMLRecord) => {
    setSelectedPage(page);
    setIsCreatingNew(false);
    // Parse JSON blocks
    try {
      const parsedBlocks = page.content ? JSON.parse(page.content) : [];
      setBlocks(parsedBlocks);
    } catch (error) {
      // Fallback
      setBlocks([
        { id: 'b-fallback-1', type: 'Heading', content: page.title, settings: { level: 'h1' } },
        { id: 'b-fallback-2', type: 'Paragraph', content: page.description }
      ]);
    }

    // Set SEO
    if (page.seoMeta) {
      setSeoMeta({
        metaTitle: page.seoMeta.metaTitle || '',
        metaDescription: page.seoMeta.metaDescription || '',
        keywords: page.seoMeta.keywords || '',
        openGraphImage: page.seoMeta.openGraphImage || '',
        schemaMarkup: page.seoMeta.schemaMarkup || '{}'
      });
    } else {
      setSeoMeta({
        metaTitle: page.title,
        metaDescription: page.description,
        keywords: '',
        openGraphImage: '',
        schemaMarkup: '{}'
      });
    }
  };

  // Block management
  const addBlock = (type: BlockType) => {
    let defaultContent = '';
    let defaultSettings: any = {};

    switch (type) {
      case 'Heading':
        defaultContent = 'Judul Blok Baru';
        defaultSettings = { level: 'h2', align: 'left' };
        break;
      case 'Paragraph':
        defaultContent = 'Tulis paragraf deskriptif Anda di sini seperti di Notion...';
        defaultSettings = { align: 'left' };
        break;
      case 'Image':
        defaultContent = 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80';
        defaultSettings = { caption: 'Masukkan deskripsi gambar opsional' };
        break;
      case 'Gallery':
        defaultContent = 'https://images.unsplash.com/photo-1542744094-3a31f103e35f,https://images.unsplash.com/photo-1522071820081-009f0129c71c';
        defaultSettings = { columns: 2 };
        break;
      case 'Video':
        defaultContent = 'https://www.w3schools.com/html/mov_bbb.mp4';
        defaultSettings = { controls: true };
        break;
      case 'Button':
        defaultContent = 'Hubungi CS';
        defaultSettings = { url: '/contact', alignment: 'left', style: 'primary-button' };
        break;
      case 'Quote':
        defaultContent = 'Pikiran yang tenang membawa kekuatan batin dan rasa percaya diri.';
        defaultSettings = { author: 'Dalai Lama' };
        break;
      case 'HTML Block':
        defaultContent = '<div class="p-4 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500">HTML Kustom Anda</div>';
        break;
      case 'Table':
        defaultContent = '';
        defaultSettings = {
          headers: ['Kolom A', 'Kolom B'],
          rows: [['Data A1', 'Data B1'], ['Data A2', 'Data B2']]
        };
        break;
      case 'Call To Action':
        defaultContent = 'Mulai Perjalanan Anda Menjadi Atlet Profesional Sekarang!';
        defaultSettings = { label: 'Daftar Sekarang', url: '/programs', style: 'primary' };
        break;
    }

    const newBlock: PageBlock = {
      id: 'block_' + Math.random().toString(36).substring(2, 9),
      type,
      content: defaultContent,
      settings: defaultSettings
    };

    setBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...blocks];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    setBlocks(reordered);
  };

  const modifyBlockContent = (id: string, value: string) => {
    setBlocks(
      blocks.map(b => (b.id === id ? { ...b, content: value } : b))
    );
  };

  const modifyBlockSettings = (id: string, partialSettings: any) => {
    setBlocks(
      blocks.map(b =>
        b.id === id
          ? { ...b, settings: { ...b.settings, ...partialSettings } }
          : b
      )
    );
  };

  // Save changes to pages.xml
  const handleSavePage = async () => {
    if (!selectedPage) return;
    setIsLoading(true);
    setMessage('');
    setError('');

    const updatedRecord: XMLRecord = {
      ...selectedPage,
      content: JSON.stringify(blocks),
      seoMeta,
      updated_at: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedRecord)
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Halaman XML berhasil disimpan dan dipublikasikan!');
        onRefreshStats();
        loadPages();
        // Update selection reference
        setSelectedPage(updatedRecord);
      }
    } catch (err: any) {
      setError('Kesalahan jaringan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Register a brand new page
  const handleCreateNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle || !newPageSlug) {
      setError('Mohon lengkapi judul dan slug halaman');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    const slugFormatted = newPageSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    const defaultNewBlocks = [
      { id: 'b1', type: 'Heading', content: newPageTitle, settings: { level: 'h1' } },
      { id: 'b2', type: 'Paragraph', content: 'Tulis paragraf konten di sini...' }
    ];

    const newPageRecord: XMLRecord = {
      id: 'page_' + Math.random().toString(36).substring(2, 9),
      slug: slugFormatted,
      title: newPageTitle,
      description: 'Halaman baru buatan CMS',
      content: JSON.stringify(defaultNewBlocks),
      image: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=800&q=80',
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seoMeta: {
        metaTitle: newPageTitle,
        metaDescription: 'Halaman baru portable BFA CMS',
        keywords: '',
        openGraphImage: '',
        schemaMarkup: '{}'
      }
    };

    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPageRecord)
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Halaman baru berhasil dibuat!');
        onRefreshStats();
        setNewPageTitle('');
        setNewPageSlug('');
        setIsCreatingNew(false);
        loadPages();
        selectPage(newPageRecord);
      }
    } catch (err: any) {
      setError('Gagal membuat halaman baru: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      
      {/* Sidebar Selector of XML Pages inside DB */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-brand-primary uppercase">Arsip Halaman XML</h3>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00AEEF] text-white shadow-sm hover:bg-[#00AEEF]/90"
            title="Tambah Halaman Baru"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* List of current active records */}
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPage(p)}
              className={`flex w-full items-center justify-between rounded-lg p-2.5 text-xs font-semibold border transition-all ${
                selectedPage?.id === p.id && !isCreatingNew
                  ? 'bg-[#0B1F3A] text-white border-brand-primary'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-100'
              }`}
            >
              <span className="truncate">{p.title}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {p.status}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="p-3 bg-brand-primary/5 rounded-lg border">
            <span className="flex items-center text-[10px] uppercase font-bold text-brand-primary">
              <Sparkles className="h-4 w-4 text-brand-secondary mr-1" /> Block Builder Notion
            </span>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
              Pilih satu arsip halaman, lalu susun dan sunting blok isinya secara visual di bawah.
            </p>
          </div>
        </div>
      </div>

      {/* Main Builder Playground Area */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-3 text-left">
        
        {/* State Banners */}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-xs text-green-700 border border-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {isCreatingNew ? (
          
          /* CREATE NEW PAGE VIEW */
          <form onSubmit={handleCreateNewPage} className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-display text-lg font-bold text-brand-primary">Pendaftaran Halaman Baru</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daftarkan metadata URL halaman dan simpan ke file XML.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Judul Halaman</label>
                <input
                  type="text"
                  placeholder="Contoh: Program Keahlian Khusus"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    // Automatic slug suggestion
                    setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }}
                  className="w-full text-xs rounded-md border border-gray-200 p-2 outline-none focus:ring-1 focus:ring-brand-secondary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Slug URL</label>
                <input
                  type="text"
                  placeholder="contoh: program-khusus"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="w-full text-xs rounded-md border border-gray-200 p-2 outline-none focus:ring-1 focus:ring-brand-secondary"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-primary/95"
              >
                Buat Halaman & Buka Editor
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="rounded-md border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>

        ) : selectedPage ? (

          /* CORE PLAYGROUND BUILDER */
          <div className="space-y-6">
            
            {/* Page Header configuration */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-secondary tracking-widest font-mono">
                  SUNTING ARCHIVE: {selectedPage.slug}.xml
                </span>
                <h3 className="font-display text-xl font-bold text-brand-primary">{selectedPage.title}</h3>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center space-x-2">
                
                {/* Status Toggle */}
                <select
                  value={selectedPage.status}
                  onChange={(e) => setSelectedPage({ ...selectedPage, status: e.target.value as any })}
                  className="rounded border border-gray-200 p-1 text-xs bg-white text-gray-600"
                >
                  <option value="draft">📁 Draft (Sembunyikan)</option>
                  <option value="published">🚀 Published (Publik)</option>
                </select>

                <button
                  onClick={handleSavePage}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-green-700 transition"
                >
                  <Save className="h-4 w-4" />
                  <span>SIMPAN KE XML</span>
                </button>

              </div>
            </div>

            {/* Notion Block Selector Tool Block */}
            <div className="rounded-xl bg-gray-50 border p-4">
              <h5 className="text-xs font-bold text-brand-primary uppercase mb-2 flex items-center">
                <Plus className="h-4 w-4 text-brand-secondary mr-1" />
                <span>Tekan untuk Menyisipkan Blocks Konten</span>
              </h5>
              
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 text-center">
                <button onClick={() => addBlock('Heading')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Heading className="h-4 w-4 text-brand-primary mb-1" />
                  <span>Heading</span>
                </button>
                <button onClick={() => addBlock('Paragraph')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <AlignLeft className="h-4 w-4 text-gray-600 mb-1" />
                  <span>Paragraf</span>
                </button>
                <button onClick={() => addBlock('Image')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Image className="h-4 w-4 text-indigo-600 mb-1" />
                  <span>Gambar</span>
                </button>
                <button onClick={() => addBlock('Gallery')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Grid className="h-4 w-4 text-pink-600 mb-1" />
                  <span>Galeri</span>
                </button>
                <button onClick={() => addBlock('Video')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Video className="h-4 w-4 text-red-600 mb-1" />
                  <span>Video</span>
                </button>
                <button onClick={() => addBlock('Button')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <MousePointer className="h-4 w-4 text-teal-600 mb-1" />
                  <span>Tombol</span>
                </button>
                <button onClick={() => addBlock('Table')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Grid className="h-4 w-4 text-amber-600 mb-1" />
                  <span>Tabel Data</span>
                </button>
                <button onClick={() => addBlock('Quote')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Quote className="h-4 w-4 text-blue-600 mb-1" />
                  <span>Kutipan</span>
                </button>
                <button onClick={() => addBlock('HTML Block')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Code className="h-4 w-4 text-gray-800 mb-1" />
                  <span>HTML Code</span>
                </button>
                <button onClick={() => addBlock('Call To Action')} className="flex flex-col items-center p-2 rounded-lg bg-white border border-gray-100 hover:border-brand-secondary cursor-pointer hover:bg-blue-50/20 text-xs">
                  <Sparkles className="h-4 w-4 text-rose-500 mb-1" />
                  <span>Blok CTA</span>
                </button>
              </div>
            </div>

            {/* List Of Dynamic Active Blocks */}
            <div className="space-y-4">
              {blocks.length === 0 ? (
                <div className="py-12 text-center text-gray-400 border border-dashed rounded-xl">
                  Belum ada blok yang ditambahkan. Gunakan menu di atas untuk menyisipkan paragraf pertama Anda!
                </div>
              ) : (
                blocks.map((block, index) => (
                  <div key={block.id} className="relative group rounded-lg border border-gray-100 bg-white p-4 shadow-sm hover:border-[#00AEEF] transition duration-200">
                    
                    {/* Header line showing type and controller arrows */}
                    <div className="flex justify-between items-center bg-gray-50/80 px-2 py-1 rounded border-b border-gray-100 mb-3 text-xs">
                      <span className="font-mono font-bold text-brand-primary uppercase text-[10px] flex items-center">
                        <Layout className="h-3 w-3 mr-1 text-brand-secondary" />
                        {block.type} BLOCK
                      </span>

                      <div className="flex items-center space-x-1">
                        <button onClick={() => moveBlock(index, 'up')} className="p-1 rounded text-gray-400 hover:text-brand-primary hover:bg-gray-150" title="Geser ke Atas">
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button onClick={() => moveBlock(index, 'down')} className="p-1 rounded text-gray-400 hover:text-brand-primary hover:bg-gray-150" title="Geser ke Bawah">
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button onClick={() => deleteBlock(block.id)} className="p-1 rounded text-red-400 hover:text-red-700 hover:bg-red-50" title="Hapus Blok">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Block inputs based on type */}
                    <div className="space-y-3">
                      {block.type === 'Heading' && (
                        <div className="flex gap-2">
                          <select
                            value={block.settings?.level || 'h2'}
                            onChange={(e) => modifyBlockSettings(block.id, { level: e.target.value })}
                            className="rounded border p-1 opacity-75 text-xs bg-white text-gray-600 outline-none"
                          >
                            <option value="h1">Level H1</option>
                            <option value="h2">Level H2</option>
                            <option value="h3">Level H3</option>
                          </select>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                            className="w-full text-sm font-bold text-brand-primary border-b border-dashed border-gray-200 focus:border-brand-primary outline-none py-1"
                          />
                        </div>
                      )}

                      {block.type === 'Paragraph' && (
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                          className="w-full text-xs text-gray-700 border rounded-md p-2 outline-none focus:ring-1 focus:ring-brand-secondary"
                        />
                      )}

                      {block.type === 'Image' && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-gray-400 font-semibold uppercase block">TAUTAN GAMBAR (URL / UPLOADS)</label>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                              className="w-full text-xs font-mono border rounded p-1.5 bg-gray-50 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-semibold uppercase block">CAPTION GAMBAR</label>
                            <input
                              type="text"
                              value={block.settings?.caption || ''}
                              onChange={(e) => modifyBlockSettings(block.id, { caption: e.target.value })}
                              className="w-full text-xs border rounded p-1.5 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'Gallery' && (
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block">DAFTAR URL (PISAHKAN DENGAN KOMA)</label>
                          <textarea
                            rows={2}
                            value={block.content}
                            onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                            className="w-full text-xs font-mono border rounded p-1.5 outline-none"
                          />
                          <div className="flex gap-4">
                            <label className="text-xs text-gray-500 flex items-center gap-1">
                              <span>Jumlah Kolom:</span>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={block.settings?.columns || 2}
                                onChange={(e) => modifyBlockSettings(block.id, { columns: parseInt(e.target.value, 10) })}
                                className="w-12 border p-0.5 rounded text-center font-mono"
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {block.type === 'Video' && (
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block">URL VIDEO (MP4, WEBM, YOUTUBE EMBED)</label>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                            className="w-full text-xs font-mono border rounded p-1.5 bg-gray-50"
                          />
                        </div>
                      )}

                      {block.type === 'Button' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 font-semibold uppercase block">NAMA LABEL TOMBOL</label>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                              className="w-full text-xs border rounded p-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-semibold uppercase block">TARGET URL</label>
                            <input
                              type="text"
                              value={block.settings?.url || ''}
                              onChange={(e) => modifyBlockSettings(block.id, { url: e.target.value })}
                              className="w-full text-xs border rounded p-1.5 font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'Quote' && (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            placeholder="Tulis kutipan kata-kata..."
                            value={block.content}
                            onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                            className="w-full text-xs italic text-gray-600 border-l-4 border-[#00AEEF] pl-4 py-1 outline-none"
                          />
                          <div>
                            <label className="text-[10px] text-gray-400 font-semibold uppercase block">NAMA PENYALUR (AUTHOR)</label>
                            <input
                              type="text"
                              value={block.settings?.author || ''}
                              onChange={(e) => modifyBlockSettings(block.id, { author: e.target.value })}
                              className="w-full text-xs border rounded p-1.5"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'HTML Block' && (
                        <div>
                          <label className="text-[10px] text-gray-400 font-semibold uppercase block mb-1">KODE HTML (CANDIDATE RECOGNITION)</label>
                          <textarea
                            rows={4}
                            value={block.content}
                            onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                            className="w-full text-xs font-mono bg-slate-900 text-white rounded-md p-2 outline-none"
                          />
                        </div>
                      )}

                      {block.type === 'Table' && (
                        <div className="space-y-2 border p-3 rounded-lg bg-gray-50/50">
                          <span className="text-[10px] text-gray-500 font-semibold block">EDITOR TABEL DATA</span>
                          <p className="text-[10px] text-slate-400">Silakan sunting data atau kolom dalam baris XML langsung di bawah.</p>
                          <table className="w-full text-left border bg-white rounded">
                            <thead>
                              <tr className="bg-gray-100 border-b text-[10px] font-bold">
                                {block.settings?.headers?.map((h: string, hIdx: number) => (
                                  <th key={hIdx} className="p-2 border-r">
                                    <input
                                      type="text"
                                      value={h}
                                      onChange={(e) => {
                                        const newHeaders = [...block.settings.headers];
                                        newHeaders[hIdx] = e.target.value;
                                        modifyBlockSettings(block.id, { headers: newHeaders });
                                      }}
                                      className="w-full bg-transparent font-bold focus:border-b"
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.settings?.rows?.map((row: string[], rIdx: number) => (
                                <tr key={rIdx} className="border-b text-xs">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2 border-r">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const newRows = [...block.settings.rows];
                                          newRows[rIdx][cIdx] = e.target.value;
                                          modifyBlockSettings(block.id, { rows: newRows });
                                        }}
                                        className="w-full bg-transparent outline-none"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newRows = [...block.settings.rows, Array(block.settings.headers.length).fill('')];
                                modifyBlockSettings(block.id, { rows: newRows });
                              }}
                              className="text-[10px] font-sans text-brand-primary bg-white border border-gray-200 px-2 py-1 rounded"
                            >
                              + Baris Baru
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newHeaders = [...block.settings.headers, `Kolom ${block.settings.headers.length + 1}`];
                                const newRows = block.settings.rows.map((r: string[]) => [...r, '']);
                                modifyBlockSettings(block.id, { headers: newHeaders, rows: newRows });
                              }}
                              className="text-[10px] font-sans text-brand-primary bg-white border border-gray-200 px-2 py-1 rounded"
                            >
                              + Kolom Baru
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === 'Call To Action' && (
                        <div className="space-y-2 bg-[#0B1F3A]/5 border border-l-4 border-[#0B1F3A] p-3 rounded">
                          <div>
                            <label className="text-[10px] text-gray-500 font-bold block">CTA SLOGAN / PESAN</label>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => modifyBlockContent(block.id, e.target.value)}
                              className="w-full text-xs font-bold text-brand-primary border rounded p-1.5"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-400 block">LABEL TOMBOL</label>
                              <input
                                type="text"
                                value={block.settings?.label || ''}
                                onChange={(e) => modifyBlockSettings(block.id, { label: e.target.value })}
                                className="w-full text-xs border rounded p-1.5"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block">TARGET TAUTAN</label>
                              <input
                                type="text"
                                value={block.settings?.url || ''}
                                onChange={(e) => modifyBlockSettings(block.id, { url: e.target.value })}
                                className="w-full text-xs border rounded p-1.5"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                ))
              )}
            </div>

            {/* SEO SYSTEM FOR THE PAGE */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 space-y-4 pt-5 mt-8 text-left">
              <div className="border-b border-gray-200 pb-2">
                <span className="flex items-center text-xs font-bold text-brand-primary uppercase">
                  <Settings className="h-4 w-4 mr-1 text-brand-secondary" />
                  SISTEM METADATA & SEO UTAMA HALAMAN YAITU
                </span>
                <p className="text-[11px] text-gray-400">Isi tag ramah mesin agar situs mudah ditemukan di Google/Bing.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={seoMeta.metaTitle}
                    onChange={(e) => setSeoMeta({ ...seoMeta, metaTitle: e.target.value })}
                    className="w-full text-xs rounded border border-gray-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">OG Image URL (Share Card)</label>
                  <input
                    type="text"
                    value={seoMeta.openGraphImage}
                    onChange={(e) => setSeoMeta({ ...seoMeta, openGraphImage: e.target.value })}
                    className="w-full text-xs rounded border border-gray-200 p-2 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Meta Description</label>
                  <textarea
                    rows={2}
                    value={seoMeta.metaDescription}
                    onChange={(e) => setSeoMeta({ ...seoMeta, metaDescription: e.target.value })}
                    className="w-full text-xs rounded border border-gray-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Keywords (Koma Terpisah)</label>
                  <input
                    type="text"
                    value={seoMeta.keywords}
                    onChange={(e) => setSeoMeta({ ...seoMeta, keywords: e.target.value })}
                    className="w-full text-xs rounded border border-gray-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Schema Markup (JSON-LD)</label>
                  <textarea
                    rows={1}
                    value={seoMeta.schemaMarkup}
                    onChange={(e) => setSeoMeta({ ...seoMeta, schemaMarkup: e.target.value })}
                    className="w-full text-xs rounded border border-gray-200 p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Anchor */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSavePage}
                disabled={isLoading}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-green-600 px-6 py-3 text-xs font-bold text-white shadow hover:bg-green-700 transition"
              >
                <Save className="h-4.5 w-4.5" />
                <span>SIMPAN PERUBAHAN KE XML</span>
              </button>
            </div>

          </div>

        ) : (
          <div className="py-24 text-center text-gray-400">
            Pilih atau buat baru satu arsip halaman terlebih dahulu dari kolom menu navigasi XML sebelah kiri.
          </div>
        )}
      </div>

    </div>
  );
}
