/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Award,
  Users,
  Calendar,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  BookOpen,
  Send,
  MessageSquare,
  ArrowRight,
  Search,
  CheckCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { XMLRecord, MenuItem, PageBlock } from '../types';

interface PublicWebsiteProps {
  searchResults: Array<{ collection: string; record: XMLRecord }> | null;
  onClearSearch: () => void;
  onSelectAdminTab?: () => void;
}

export default function PublicWebsite({
  searchResults,
  onClearSearch,
  onSelectAdminTab
}: PublicWebsiteProps) {
  // Navigation
  const [activeMenu, setActiveMenu] = useState<string>('home');
  const [menus, setMenus] = useState<MenuItem[]>([]);
  
  // XML database records lists
  const [pages, setPages] = useState<XMLRecord[]>([]);
  const [news, setNews] = useState<XMLRecord[]>([]);
  const [programs, setPrograms] = useState<XMLRecord[]>([]);
  const [coaches, setCoaches] = useState<XMLRecord[]>([]);
  const [events, setEvents] = useState<XMLRecord[]>([]);
  const [sponsors, setSponsors] = useState<XMLRecord[]>([]);
  const [testimonials, setTestimonials] = useState<XMLRecord[]>([]);

  // Page active blocks loading helper
  const [activePageBlocks, setActivePageBlocks] = useState<PageBlock[]>([]);
  const [activePageSchema, setActivePageSchema] = useState<string>('');
  
  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactDone, setContactDone] = useState(false);

  // Fetch all databases content
  const loadPublicData = async () => {
    try {
      const [mRes, pRes, nRes, prRes, cRes, eRes, sRes, tRes] = await Promise.all([
        fetch('/api/menus'),
        fetch('/api/cms/pages'),
        fetch('/api/cms/news'),
        fetch('/api/cms/programs'),
        fetch('/api/cms/coaches'),
        fetch('/api/cms/events'),
        fetch('/api/cms/sponsors'),
        fetch('/api/cms/testimonials')
      ]);

      const [mData, pData, nData, prData, cData, eData, sData, tData] = await Promise.all([
        mRes.json(),
        pRes.json(),
        nRes.json(),
        prRes.json(),
        cRes.json(),
        eRes.json(),
        sRes.json(),
        tRes.json()
      ]);

      if (mData.menus) setMenus(mData.menus);
      if (pData.records) setPages(pData.records);
      if (nData.records) setNews(nData.records.filter((r: XMLRecord) => r.status === 'published'));
      if (prData.records) setPrograms(prData.records.filter((r: XMLRecord) => r.status === 'published'));
      if (cData.records) setCoaches(cData.records.filter((r: XMLRecord) => r.status === 'published'));
      if (eData.records) setEvents(eData.records.filter((r: XMLRecord) => r.status === 'published'));
      if (sData.records) setSponsors(sData.records.filter((r: XMLRecord) => r.status === 'published'));
      if (tData.records) setTestimonials(tData.records.filter((r: XMLRecord) => r.status === 'published'));

    } catch (err) {
      console.error('Gagal memuat database publik dari server local:', err);
    }
  };

  useEffect(() => {
    loadPublicData();
  }, [searchResults]);

  // Handle active page deserialization on navigation
  useEffect(() => {
    if (pages.length === 0) return;
    
    // Default to 'home' or slug-matched page
    const currentPage = pages.find((p) => p.slug === activeMenu) || pages.find((p) => p.slug === 'home');
    if (currentPage) {
      try {
        const parsed = currentPage.content ? JSON.parse(currentPage.content) : [];
        setActivePageBlocks(parsed);
      } catch (e) {
        setActivePageBlocks([]);
      }
      setActivePageSchema(currentPage.seoMeta?.schemaMarkup || '');
    } else {
      setActivePageBlocks([]);
      setActivePageSchema('');
    }
  }, [pages, activeMenu]);

  // Set page custom script element if Schema JSON-LD markup is present
  useEffect(() => {
    if (!activePageSchema) return;
    const scriptId = 'bfa-seo-schema-markup';
    const oldScript = document.getElementById(scriptId);
    if (oldScript) {
      oldScript.remove();
    }

    try {
      // Validate schema JSON first
      JSON.parse(activePageSchema);
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.innerHTML = activePageSchema;
      document.head.appendChild(script);
    } catch (error) {
      // Ignore if invalid
    }
  }, [activePageSchema]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;

    // Simulate sending
    setContactDone(true);
    setContactName('');
    setContactEmail('');
    setContactMsg('');
    setTimeout(() => setContactDone(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-stone-800">
      
      {/* HEADER WEBSITE */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-[64px] z-40 text-left">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            
            {/* Dynamic Sitemaps Navigation links from menus.xml */}
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-1">
              {menus.map((m) => {
                const isPageBased = !m.url.startsWith('http') && !m.url.startsWith('/') && m.url !== '#';
                const menuSlug = isPageBased ? m.url : m.url === '/' ? 'home' : m.url.replace(/^\//, '');

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onClearSearch();
                      setActiveMenu(menuSlug);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold whitespace-nowrap tracking-tight transition ${
                      activeMenu === menuSlug && !searchResults
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'text-brand-primary hover:bg-gray-100'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </nav>

            {/* Portal Action Trigger */}
            <div className="hidden items-center text-xs sm:flex text-gray-500 font-mono">
              <span>DB SOURCE:</span>
              <span className="text-emerald-600 font-bold ml-1">/data/*.xml (100% OFFLINE)</span>
            </div>

          </div>
        </div>
      </div>

      {/* BODY WEBSITE CONTAINER */}
      <main className="flex-grow py-8 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 text-left">
        
        {/* RENDER THE REUSABLE GLOBAL SEARCH PORTAL RESULTS */}
        {searchResults ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="font-display text-lg font-bold text-brand-primary uppercase">
                Hasil Pencarian Konten XML ({searchResults.length} Berhasil Ditemukan)
              </h2>
              <button
                onClick={onClearSearch}
                className="text-xs text-gray-500 hover:text-brand-secondary underline"
              >
                Kembali ke Beranda
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-24 text-center text-gray-400 font-display">
                Tidak ada entri XML yang cocok dengan kata kunci anda. Silakan cari tag lain di database.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onClearSearch();
                      setActiveMenu(item.collection); // Navigate to tab
                    }}
                    className="p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition duration-200 cursor-pointer text-left"
                  >
                    <span className="text-[10px] font-mono font-bold uppercase text-brand-secondary bg-blue-50 px-2 py-0.5 rounded border">
                      modul: {item.collection}
                    </span>
                    <h4 className="font-display text-sm font-bold text-brand-primary mt-2">{item.record.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-3">{item.record.description}</p>
                    <div className="mt-3 flex items-center text-[10px] text-gray-400 font-mono">
                      <span>Ref: {item.record.slug}.xml</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          /* PUBLIC TABS ROUTING SYSTEM */
          <div className="space-y-12">
            
            {/* 1. HOME & ABOUT SLUGS: Renders the beautiful dynamic Page Builder blocks system! */}
            {(activeMenu === 'home' || activeMenu === 'about' || pages.some(p => p.slug === activeMenu)) && (
              <div className="space-y-10 max-w-4xl mx-auto">
                {activePageBlocks.length === 0 ? (
                  <div className="text-center py-24 bg-white border rounded-xl shadow-xs text-gray-400">
                    <h3 className="font-bold text-lg text-brand-primary mb-2">Halaman Tanpa Konten</h3>
                    <p className="text-xs">Hubungi Administrator Anda untuk menyisipkan modul Notion-block pada rincian halaman XML ini.</p>
                  </div>
                ) : (
                  activePageBlocks.map((block) => {
                    const blockAlign = block.settings?.align || 'left';
                    const listCols = block.settings?.columns || 2;

                    return (
                      <div
                        key={block.id}
                        className={`transition-colors text-${blockAlign} ${
                          block.type === 'Quote' ? 'border-l-4 border-[#00AEEF] pl-6 italic font-sans text-lg text-gray-600' : ''
                        }`}
                      >
                        
                        {/* Heading Block */}
                        {block.type === 'Heading' && (
                          <div className="mt-6 mb-3">
                            {block.settings?.level === 'h1' ? (
                              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">{block.content}</h1>
                            ) : block.settings?.level === 'h3' ? (
                              <h3 className="font-display text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight">{block.content}</h3>
                            ) : (
                              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">{block.content}</h2>
                            )}
                          </div>
                        )}

                        {/* Paragraph Block */}
                        {block.type === 'Paragraph' && (
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-3xl">
                            {block.content}
                          </p>
                        )}

                        {/* Image Block */}
                        {block.type === 'Image' && (
                          <div className="my-6 rounded-xl overflow-hidden border shadow-sm">
                            <img
                              src={block.content}
                              alt="Custom Media Asset"
                              referrerPolicy="no-referrer"
                              className="w-full max-h-[400px] object-cover"
                            />
                            {block.settings?.caption && (
                              <div className="p-3 bg-gray-50 text-center text-xs text-gray-400 font-medium">
                                {block.settings.caption}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Gallery Grid Block */}
                        {block.type === 'Gallery' && (
                          <div className={`grid gap-4 my-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-${listCols}`}>
                            {block.content.split(',').map((imgUrl, uIdx) => (
                              <div key={uIdx} className="rounded-lg overflow-hidden border shadow-xs h-44">
                                <img
                                  src={imgUrl.trim()}
                                  alt="Gallery item"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover hover:scale-105 transition"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Video Block */}
                        {block.type === 'Video' && (
                          <div className="my-6 rounded-lg overflow-hidden border shadow-sm">
                            <video className="w-full" controls playsInline muted>
                              <source src={block.content} type="video/mp4" />
                            </video>
                          </div>
                        )}

                        {/* Quote Block */}
                        {block.type === 'Quote' && (
                          <div>
                            <p className="text-md sm:text-lg text-gray-700 font-serif">"{block.content}"</p>
                            {block.settings?.author && (
                              <p className="text-xs text-brand-secondary font-semibold font-mono mt-2">— {block.settings.author}</p>
                            )}
                          </div>
                        )}

                        {/* Button Block */}
                        {block.type === 'Button' && (
                          <div className="my-4">
                            <a
                              href={block.settings?.url || '#'}
                              className="inline-flex items-center space-x-1 rounded bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-primary/95"
                            >
                              <span>{block.content}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}

                        {/* Custom HTML Block */}
                        {block.type === 'HTML Block' && (
                          <div
                            className="my-4 overflow-x-auto rounded border p-4 bg-gray-50 font-mono text-xs"
                            dangerouslySetInnerHTML={{ __html: block.content }}
                          />
                        )}

                        {/* Custom Table Block */}
                        {block.type === 'Table' && (
                          <div className="my-6 border rounded-xl overflow-hidden shadow-xs bg-white">
                            <table className="w-full text-left text-xs text-stone-700">
                              <thead className="bg-[#0B1F3A]/5 border-b text-[10px] uppercase font-bold text-brand-primary font-display">
                                <tr>
                                  {block.settings?.headers?.map((h: string, key: number) => (
                                    <th key={key} className="p-3 border-r">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {block.settings?.rows?.map((row: string[], keyRow: number) => (
                                  <tr key={keyRow} className="border-b hover:bg-gray-50/50">
                                    {row.map((cell, keyCell) => (
                                      <td key={keyCell} className="p-3 border-r">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Call To Action Block */}
                        {block.type === 'Call To Action' && (
                          <div className="my-8 rounded-xl bg-gradient-to-r from-brand-primary to-slate-900 p-8 text-white shadow-lg space-y-4 text-center">
                            <h3 className="font-display text-xl sm:text-2xl font-bold">{block.content}</h3>
                            <div className="flex justify-center">
                              <a
                                href={block.settings?.url || '#'}
                                className="rounded bg-brand-accent px-5 py-2.5 text-xs font-bold text-brand-primary shadow hover:bg-yellow-500 transition"
                              >
                                {block.settings?.label || 'Mulai'}
                              </a>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. PROGRAMS PATH: Display active training programs directory */}
            {activeMenu === 'programs' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">MITRA BERATLET</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Program Pembinaan Olahraga</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Berbagai pilihan akademi intensif panahan dan ketangkasan fisik lokal berstandar kompetitif nasional.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                  {programs.map((prog) => (
                    <div key={prog.id} className="rounded-xl border bg-white shadow-sm hover:shadow-md overflow-hidden transition duration-200 text-left">
                      <div className="h-44 overflow-hidden border-b">
                        <img
                          src={prog.image}
                          alt={prog.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="space-y-1.5 h-32 overflow-hidden">
                          <h4 className="font-display text-sm font-bold text-brand-primary">{prog.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 italic">{prog.description}</p>
                          <p className="text-xs text-gray-500 line-clamp-3 mt-2">{prog.content}</p>
                        </div>
                        
                        <div className="border-t pt-3 flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="block text-[8px] text-gray-450 uppercase">Biaya Bulanan</span>
                            <span className="font-bold text-green-700">{prog.price}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-[8px] text-gray-450 uppercase">Durasi</span>
                            <span className="font-bold text-brand-primary">{prog.duration}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setActiveMenu('contact');
                            setContactMsg(`Halo Admin BFA CMS, Saya tertarik mendaftar program pembinaan: ${prog.title}`);
                          }}
                          className="w-full rounded bg-brand-primary py-2 text-xs font-bold text-white shadow-xs text-center hover:bg-brand-primary/95 transition"
                        >
                          Booking Slot Program
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. COACHES PATH: Biographies of team coaches */}
            {activeMenu === 'coaches' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">INSTRUKTUR KHUSUS</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Pelatih & Mentor Berpengalaman</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans">Melangkah lebih jauh dibimbing oleh para pakar atletik dan pelatih militer berlisensi nasional.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pt-4">
                  {coaches.map((coach) => (
                    <div key={coach.id} className="rounded-xl border bg-white shadow-xs p-5 hover:shadow-md transition text-center space-y-3">
                      <div className="h-28 w-28 rounded-full overflow-hidden border mx-auto">
                        <img
                          src={coach.image}
                          alt={coach.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-display text-xs font-bold text-[#0B1F3A]">{coach.title}</h4>
                        <span className="text-[10px] font-mono text-brand-secondary font-bold uppercase">{coach.specialty}</span>
                        <p className="text-[10px] font-mono text-gray-400 mt-1">{coach.instagram}</p>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed text-center line-clamp-3">
                        {coach.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. GALLERY PATH: Photo/Portfolio board */}
            {activeMenu === 'gallery' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">PORTFOLIO AKTIVITAS</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Galeri Multimedia</h3>
                  <p className="text-xs text-gray-500">Momen-momen gemilang, dokumentasi latihan daerah, dan kejuaraan atlet BFA.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pt-4">
                  {/* Pull dynamically uploaded imagery from Media Library files documents */}
                  {testimonials.map((test, index) => (
                    <div key={index} className="rounded-xl overflow-hidden shadow-xs border h-44 group relative">
                      <img
                        src={test.image || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=500&q=80'}
                        alt={test.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-115"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end text-white text-left opacity-0 group-hover:opacity-100 transition duration-200">
                        <span className="text-[10px] font-bold text-brand-accent">{test.title}</span>
                        <p className="text-[9px] text-gray-200 line-clamp-1">{test.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. NEWS PATH: Display active news portal */}
            {activeMenu === 'news' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">BERITA TERBARU</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Warta Kejuaraan & Informasi</h3>
                  <p className="text-xs text-gray-500">Liputan turnamen, ulasan tips latihan olahraga, dan berita pers korporatif.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                  {news.map((item) => (
                    <div key={item.id} className="rounded-xl border bg-white shadow-xs overflow-hidden hover:shadow-md transition duration-200 flex flex-col justify-between text-left">
                      <div className="h-40 overflow-hidden border-b">
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                      </div>
                      <div className="p-4 space-y-2 flex-grow">
                        <span className="inline-block text-[9px] font-bold text-brand-secondary uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {item.category || 'Berita'}
                        </span>
                        <h4 className="font-display text-sm font-bold text-brand-primary line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-3">{item.description}</p>
                      </div>

                      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                        <span>{item.created_at ? new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'short' }) : '-'}</span>
                        <button
                          onClick={() => {
                            alert(`BFA CMS Enterprise File System\nJudul: ${item.title}\n\nIsi Lengkap:\n${item.content}`);
                          }}
                          className="text-brand-secondary font-bold hover:underline"
                        >
                          Selengkapnya
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. EVENTS SCHEDULES PATH */}
            {activeMenu === 'events' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">EVENTS OUTLOOK</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Agenda Turnamen Terdekat</h3>
                  <p className="text-xs text-gray-500">Ikuti keseruan dan dukung tim olahraga pangkalan kami di berbagai event bergengsi berikut.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 max-w-3xl mx-auto pt-4">
                  {events.map((ev) => (
                    <div key={ev.id} className="rounded-xl border bg-white p-5 shadow-xs flex flex-col md:flex-row items-center gap-5 hover:shadow-md transition text-left">
                      <div className="h-24 w-full md:w-36 rounded-lg overflow-hidden border">
                        <img
                          src={ev.image || 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80'}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-grow space-y-2">
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-brand-secondary">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>WAKTU: {ev.event_date ? new Date(ev.event_date).toLocaleString('id-ID') : '-'}</span>
                        </div>
                        <h4 className="font-display text-xs sm:text-sm font-bold text-brand-primary">{ev.title}</h4>
                        <p className="text-xs text-gray-400 font-sans italic">{ev.description}</p>
                        <p className="text-xs text-gray-500 leading-normal">{ev.content}</p>
                        <div className="flex items-center text-[10px] text-gray-400 font-mono">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>Tempat: {ev.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. SPONSORS PARTNERS AREA */}
            {activeMenu === 'sponsors' && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">PARTNERS MITRA</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Mitra Sponsor Kami</h3>
                  <p className="text-xs text-gray-500">Terima kasih atas dedikasi dan dukungan finansial tak terbatas dari korporasi partner berikut.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 max-w-4xl mx-auto pt-4 text-center">
                  {sponsors.map((spo) => (
                    <div key={spo.id} className="rounded-xl border bg-white p-5 flex flex-col items-center justify-between shadow-xs hover:border-brand-secondary transition">
                      <div className="h-16 w-full flex items-center justify-center p-2 mb-2">
                        <img
                          src={spo.image}
                          alt={spo.title}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-display text-xs font-bold text-brand-primary">{spo.title}</h4>
                        <span className="text-[9px] font-mono bg-amber-50 text-amber-700 font-bold border border-amber-100 rounded px-1.5 py-0.5 inline-block mt-1">
                          {spo.level}
                        </span>
                      </div>
                      <a
                        href={spo.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-brand-secondary flex items-center gap-1 hover:underline mt-2.5 font-mono"
                      >
                        <span>Kunjungi Situs</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. CONTACT COMPLETED WITH DYNAMIC MESSAGES */}
            {activeMenu === 'contact' && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-4xl mx-auto pt-4 text-left">
                
                {/* Information cards */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest font-mono">KONTAK KAMI</span>
                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">Hubungi Layanan BFA</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans">Layanan respons cepat untuk booking, bimbingan, sponsorship, pendaftaran mitra, dan arsip keanggotaan pangkalan.</p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center space-x-3 p-3.5 bg-white border rounded-xl shadow-xs">
                      <MapPin className="h-5 w-5 text-brand-secondary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-brand-primary">Alamat Workstation</p>
                        <p className="text-gray-500">Jl. Pangeran Jayakarta No. 128, Senen, Jakarta Pusat, Indonesia</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3.5 bg-white border rounded-xl shadow-xs">
                      <Phone className="h-5 w-5 text-brand-secondary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-brand-primary">Nomor Layanan Telepon</p>
                        <p className="text-gray-500">+62 21-5089-1224 (Jam Kerja Lokal)</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3.5 bg-white border rounded-xl shadow-xs">
                      <Mail className="h-5 w-5 text-brand-secondary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-brand-primary">Surat Elektronik (Email)</p>
                        <p className="text-gray-500">support@bfa.cms</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form interactive card */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
                  {contactDone ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-brand-primary uppercase">Terima Kasih!</h4>
                      <p className="text-xs text-gray-500">Pesan hubungan Anda berhasil terekam offline di log pangkalan. Tim CS akan segera menghubungi Anda kembali!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                      <h4 className="font-display text-sm font-bold text-brand-primary uppercase">Kirim Pesan Hubungan Offline</h4>
                      
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full text-xs rounded border border-gray-200 p-2.5 outline-none focus:ring-1 focus:ring-brand-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Email Anda</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full text-xs rounded border border-gray-200 p-2.5 outline-none focus:ring-1 focus:ring-brand-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Isi Berita Pesan / Booking Info</label>
                        <textarea
                          rows={4}
                          required
                          value={contactMsg}
                          onChange={(e) => setContactMsg(e.target.value)}
                          className="w-full text-xs rounded border border-gray-200 p-2.5 outline-none focus:ring-1 focus:ring-brand-secondary"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded bg-brand-primary py-2.5 text-xs font-bold text-white shadow hover:bg-brand-primary/95 flex items-center justify-center space-x-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Kirim Pesan</span>
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER ENTERPRISE */}
      <footer className="bg-brand-primary text-gray-300 py-10 mt-16 border-t border-white/5 text-left text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="font-display font-extrabold text-white">BFA CMS ENTERPRISE XML EDITION</h4>
              <p className="text-[10px] text-gray-400">Content Management System portable bertenaga Node.js + SQLite + XML.</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onSelectAdminTab}
                className="text-xs text-brand-accent hover:underline font-mono bg-white/5 border border-white/10 rounded px-2.5 py-1"
              >
                Akses Console Admin
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-gray-450">
            <p>© 2026 BFA CMS Enterprise Inc. Seluruh hak cipta dilindungi undang-undang.</p>
            <p className="font-mono">Offline Portable Engine - Laptop & mini-PC Deployment Approved</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
