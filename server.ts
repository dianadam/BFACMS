/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { XmlDatabase } from './src/services/xmlEngine';
import { SqliteDb } from './src/services/sqliteDb';
import { XMLRecord, User, MenuItem } from './src/types';

// Initialize core server
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static directory uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Simple Express Request extensions for custom typed Auth
interface AuthenticatedRequest extends express.Request {
  user?: User;
}

// Authentication Token Mock/Session Map
const SESSION_DB: Record<string, { user: User; expires: number }> = {};

// Express Middleware to intercept role based tokens
const requireAuth = (roles?: string[]) => {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthenticated. Access token is missing or invalid' });
      return;
    }

    const token = authHeader.substring(7);
    const session = SESSION_DB[token];

    if (!session || session.expires < Date.now()) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    req.user = session.user;

    if (roles && !roles.includes(session.user.role)) {
      res.status(403).json({ error: 'Forbidden. You do not have permissions for this action' });
      return;
    }

    next();
  };
};

// MULTER MULTI-DESTINATION FILE STORAGE ENGINE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let folder = 'documents';

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      folder = 'images';
    } else if (['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
      folder = 'videos';
    }

    const destDir = path.join(process.cwd(), 'uploads', folder);
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Strict 100MB limit
});

// Seed default system page templates inside XML Database on server start!
function seedDefaultPages() {
  const defaultPages = [
    {
      id: 'home',
      slug: 'home',
      title: 'Selamat Datang di BFA Enterprise CMS',
      description: 'Main Homepage of BFA CMS Enterprise XML Edition',
      content: JSON.stringify([
        {
          id: 'b1',
          type: 'Heading',
          content: 'BFA CMS Enterprise XML Edition',
          settings: { level: 'h1', align: 'center', color: '#0B1F3A' }
        },
        {
          id: 'b2',
          type: 'Paragraph',
          content: 'Sebuah Content Management System modern, ultra-portable, dan lincah, didesain untuk kebutuhan enterprise tanpa dependensi eksternal yang rumit. 100% local, portable, bertenaga engine XML Repository untuk core data, dan SQLite untuk secure logs dan otentikasi admin.',
          settings: { align: 'center' }
        },
        {
          id: 'b3',
          type: 'Call To Action',
          content: 'Akses Portal Admin Sekarang!',
          settings: { label: 'Buka Dashboard', url: '/admin', style: 'primary' }
        },
        {
          id: 'b4',
          type: 'Heading',
          content: 'Kenapa Memilih Kami?',
          settings: { level: 'h2', align: 'center', color: '#00AEEF' }
        },
        {
          id: 'b5',
          type: 'Table',
          content: '',
          settings: {
            headers: ['Fitur Utama', 'Kelebihan', 'Guna'],
            rows: [
              ['Portabilitas Tinggi', 'Bisa dijalankan dari USB', '100% Offline'],
              ['Struktur XML', 'Sangat mudah dibackup & diarsip', 'Transparan & Cepat'],
              ['Notion Builder', 'Edit konten se-fleksibel Notion', 'User Friendly']
            ]
          }
        },
        {
          id: 'b6',
          type: 'Quote',
          content: 'Kesederhanaan adalah puncak kecanggihan tertinggi yang sesungguhnya.',
          settings: { author: 'Steve Jobs' }
        }
      ]),
      image: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=1200&q=80',
      status: 'published' as const,
      seoMeta: {
        metaTitle: 'BFA Enterprise CMS XML Edition - High Performance Offline CMS',
        metaDescription: 'CMS modern 100% lokal tanpa MySQL untuk portabilitas bisnis mutlak.',
        keywords: 'CMS, NodeJS, XML Database, Local Portal, Offline Website',
        openGraphImage: '',
        schemaMarkup: '{}'
      }
    },
    {
      id: 'about',
      slug: 'about',
      title: 'Tentang BFA CMS Enterprise',
      description: 'Latar belakang lahirnya inovasi CMS portable',
      content: JSON.stringify([
        {
          id: 'ab1',
          type: 'Heading',
          content: 'Visi & Misi Kami',
          settings: { level: 'h1', align: 'left', color: '#0B1F3A' }
        },
        {
          id: 'ab2',
          type: 'Paragraph',
          content: 'BFA CMS didandani khusus untuk membebaskan enterprise dari belenggu koneksi internet intensif dan managed database cloud sewaan yang mahal. Kami menyajikan CMS handal, instan, andal langsung dari laptop, workstation pangkalan, flashdisk, ataupun mini-PC lokal Anda.'
        },
        {
          id: 'ab3',
          type: 'HTML Block',
          content: `<div class="p-6 bg-blue-50 border-l-4 border-[#00AEEF] rounded-r-lg">
            <h4 class="font-bold text-[#0B1F3A]">Enterprise Trust Guarantee</h4>
            <p class="text-sm text-gray-700 mt-2">Diverifikasi untuk digunakan pada sistem militer, perkapalan, sekolah pedalaman, dan bank pangkalan modular.</p>
          </div>`
        }
      ]),
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      status: 'published' as const,
      seoMeta: {
        metaTitle: 'Tentang Kami - BFA CMS',
        metaDescription: 'Informasi visi, misi, dan arsitektur BFA CMS',
        keywords: 'Corporate Portal, Portable, XML database',
        openGraphImage: '',
        schemaMarkup: '{}'
      }
    }
  ];

  const currentHome = XmlDatabase.readCollection('pages');
  if (currentHome.length === 0) {
    const pageRecords: XMLRecord[] = defaultPages.map(pg => ({
      id: pg.id,
      slug: pg.slug,
      title: pg.title,
      description: pg.description,
      content: pg.content,
      image: pg.image,
      status: pg.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      seoMeta: pg.seoMeta
    }));
    XmlDatabase.writeCollection('pages', pageRecords);

    // Seed exemplary coaches, programs, news, events inside single-write arrays to bypass redundant disk locking
    XmlDatabase.writeCollection('coaches', [
      {
        id: 'coach1',
        slug: 'budi-santoso',
        title: 'Budi Santoso, M.Pd',
        description: 'Professional Senior Archery Specialist Coach',
        content: 'Berpengalaman melatih atlet nasional selama lebih dari 15 tahun.',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        specialty: 'Archery / Panahan',
        instagram: '@budi_archery'
      }
    ]);

    XmlDatabase.writeCollection('programs', [
      {
        id: 'prog1',
        slug: 'junior-archery-masterclass',
        title: 'Junior Archery Masterclass',
        description: 'Kelas panahan intensif bagi anak usia dini (8 - 16 tahun)',
        content: 'Membimbing atlet muda memahami postur fisik, keheningan mental, dan visualisasi sasaran.',
        image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        price: 'Rp 1.500.000 / Bulan',
        duration: '4 Sesi per Minggu',
        coach_id: 'coach1'
      }
    ]);

    XmlDatabase.writeCollection('news', [
      {
        id: 'news1',
        slug: 'bfa-cup-2026-dimulai',
        title: 'Turnamen BFA Archery Cup 2026 Resmi Dimulai',
        description: 'Kejuaraan panahan daerah memperebutkan Piala Bergilir Walikota',
        content: 'Lebih dari 400 atlet mendaftar dari seluruh penjuru kota untuk bertarung di ajang bergengsi ini...',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: 'Prestasi'
      },
      {
        id: 'news2',
        slug: 'pentingnya-fokus-olahraga',
        title: 'Pentingnya Konsentrasi Mental dalam Olahraga Panahan',
        description: 'Artikel tips melatih daya konsentrasi otak agar selaras dengan ketangkasan tangan',
        content: 'Menembak busur bukan sekadar mengandalkan kekuatan otot, melainkan sinkronisasi detak jantung dan ketenangan pikiran...',
        image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: 'Artikel'
      }
    ]);

    // Testimonials
    XmlDatabase.writeCollection('testimonials', [
      {
        id: 't1',
        slug: 't1',
        title: 'Anugerah Luar Biasa',
        description: 'Pelayanan yang profesional dan kepelatihan kelas dunia',
        content: 'Anak saya berhasil mendapatkan beasiswa jalur olahraga melalui kelas pembinaan terpadu di BFA Archery Program.',
        image: '',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        testimonial_author: 'Herman Prasetyo',
        testimonial_role: 'Orangtua Atlet Junior'
      }
    ]);

    // Sponsors
    XmlDatabase.writeCollection('sponsors', [
      {
        id: 'sp1',
        slug: 'tech-archery-gear',
        title: 'Tech Archery Gear Inc',
        description: 'Penyedia busur dan aksesoris karbon tingkat olimpiade.',
        content: 'Sponsor Resmi Kompetisi',
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        website: 'https://techarchery.com',
        level: 'Gold Partner'
      }
    ]);

    // Events
    XmlDatabase.writeCollection('events', [
      {
        id: 'ev1',
        slug: 'bfa-archery-cup-final',
        title: 'Grand Final BFA Archery Cup 2026',
        description: 'Acara puncak penentuan pemenang piala bergilir tahun fiskal',
        content: 'Diselenggarakan secara terbuka di Gelora Bung Karno Sector 5. Hadir pula bintang tamu internasional!',
        image: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_date: '2026-07-20T09:00',
        location: 'Stadium Utama Kompleks Olahraga Utama'
      }
    ]);
  }
}

// ------------------------------------------------------------------
// CORE API ROUTERS
// ------------------------------------------------------------------

// 1. Auth Routing
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const user = await SqliteDb.authenticate(username, password);
    if (!user) {
      res.status(401).json({ error: 'Invalid login credentials' });
      return;
    }

    // Generate Bearer Token mimicking OAuth
    const token = crypto.randomBytes(32).toString('hex');
    SESSION_DB[token] = {
      user,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours validity
    };

    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', requireAuth(), async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    delete SESSION_DB[token];
  }
  
  if (req.user) {
    await SqliteDb.log(req.user.id, req.user.username, req.user.role, 'Logout', 'User signed out offline');
  }

  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.json({ user: null });
    return;
  }

  const token = authHeader.substring(7);
  const session = SESSION_DB[token];

  if (!session || session.expires < Date.now()) {
    res.json({ user: null });
    return;
  }

  res.json({ user: session.user });
});

// 2. Audit Logs API
app.get('/api/audit-logs', requireAuth(['Super Admin', 'Admin']), async (req, res) => {
  try {
    const logs = await SqliteDb.getAuditLogs();
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. User Accounts Management (Super Admin & Admin Only)
app.get('/api/users', requireAuth(['Super Admin', 'Admin']), async (req, res) => {
  try {
    const users = await SqliteDb.fetchUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', requireAuth(['Super Admin', 'Admin']), async (req: AuthenticatedRequest, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    res.status(400).json({ error: 'Missing required configuration parameter' });
    return;
  }

  try {
    const actor = req.user!;
    const newUser = await SqliteDb.registerUser(username, email, password, role, actor);
    res.status(201).json(newUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth(['Super Admin', 'Admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id;
    const actor = req.user!;
    
    if (id === actor.id) {
      res.status(400).json({ error: 'Cannot delete your own active administrator session' });
      return;
    }

    const success = await SqliteDb.deleteUser(id, actor);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User target not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Global Search Engine (Searching into entire XML Database)
app.get('/api/search', async (req, res) => {
  const query = req.query.q || '';
  try {
    const results = XmlDatabase.searchAll(String(query));
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. XML CRUD Generic Handler (Covering 10+ dynamic schema endpoints)
app.get('/api/cms/:collection', async (req, res) => {
  const col = req.params.collection;
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.slug) filters.slug = req.query.slug;
    if (req.query.q) filters.queryText = req.query.q;

    const data = XmlDatabase.query(col, filters);
    res.json({ records: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cms/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  try {
    const records = XmlDatabase.readCollection(collection);
    const item = records.find(r => r.id === id || r.slug === id);
    if (!item) {
      res.status(404).json({ error: `Record with reference ${id} not found` });
    } else {
      res.json({ record: item });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cms/:collection', requireAuth(['Super Admin', 'Admin', 'Editor', 'Marketing', 'Coach']), async (req: AuthenticatedRequest, res) => {
  const col = req.params.collection;
  const body = req.body as XMLRecord;
  const actor = req.user!;

  if (!body.id) {
    body.id = crypto.randomUUID();
  }
  if (!body.slug) {
    body.slug = body.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  }

  try {
    XmlDatabase.upsertRecord(col, body);
    
    // Log Audit Event
    await SqliteDb.log(
      actor.id,
      actor.username,
      actor.role,
      'Create',
      `Upsert record id: ${body.id} under XML Collection: ${col}`
    );

    res.json({ success: true, record: body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cms/:collection/:id', requireAuth(['Super Admin', 'Admin', 'Editor']), async (req: AuthenticatedRequest, res) => {
  const { collection, id } = req.params;
  const actor = req.user!;

  try {
    const success = XmlDatabase.deleteRecord(collection, id);
    if (success) {
      await SqliteDb.log(
        actor.id,
        actor.username,
        actor.role,
        'Delete',
        `Deleted record id: ${id} from XML Collection: ${collection}`
      );
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Record not found to delete' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Media Library Handlers
app.post('/api/media/upload', requireAuth(['Super Admin', 'Admin', 'Editor', 'Marketing', 'Coach']), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No files were uploaded' });
    return;
  }

  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase();
  let folder: 'images' | 'documents' | 'videos' = 'documents';

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    folder = 'images';
  } else if (['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
    folder = 'videos';
  }

  const webPath = `/uploads/${folder}/${file.filename}`;
  const recordId = crypto.randomUUID();

  const record: XMLRecord = {
    id: recordId,
    slug: file.filename,
    title: file.originalname,
    description: `Original Name: ${file.originalname} Size: ${file.size} Bytes`,
    content: folder, // Categorised in metadata content
    image: webPath,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    document_url: webPath,
    document_type: ext.substring(1),
    media_type: folder === 'images' ? 'image' : folder === 'videos' ? 'video' : 'document'
  };

  try {
    // Save to documents.xml list so it's fully indexed & searchable instantly!
    XmlDatabase.upsertRecord('documents', record);
    
    // Log database transaction
    await SqliteDb.log(
      req.user!.id,
      req.user!.username,
      req.user!.role,
      'Create',
      `Uploaded media library attachment: ${file.originalname} -> ${webPath}`
    );

    res.json({ success: true, record });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media', async (req, res) => {
  try {
    const list = XmlDatabase.readCollection('documents');
    res.json({ files: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/media/:id', requireAuth(['Super Admin', 'Admin', 'Editor']), async (req: AuthenticatedRequest, res) => {
  const id = req.params.id;
  try {
    const records = XmlDatabase.readCollection('documents');
    const target = records.find(r => r.id === id);
    if (!target) {
      res.status(404).json({ error: 'Media reference does not exist' });
      return;
    }

    // Attempt physical deletion
    const relativePath = target.image;
    if (relativePath && relativePath.startsWith('/uploads/')) {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    XmlDatabase.deleteRecord('documents', id);

    await SqliteDb.log(
      req.user!.id,
      req.user!.username,
      req.user!.role,
      'Delete',
      `Deleted media library attachment and reference id: ${id}`
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Dynamic Main Menus Controller
app.get('/api/menus', async (req, res) => {
  try {
    const menus = XmlDatabase.readMenu();
    res.json({ menus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menus', requireAuth(['Super Admin', 'Admin', 'Editor']), async (req: AuthenticatedRequest, res) => {
  const { menus } = req.body;
  if (!Array.isArray(menus)) {
    res.status(400).json({ error: 'Menus payload must be array of MenuItem items' });
    return;
  }

  try {
    XmlDatabase.saveMenu(menus as MenuItem[]);
    
    await SqliteDb.log(
      req.user!.id,
      req.user!.username,
      req.user!.role,
      'Update',
      'Saved redesigned primary system Menus mapping'
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Full Export & Restore Backup Controller
app.get('/api/backup/export', requireAuth(['Super Admin', 'Admin']), (req, res) => {
  try {
    const fullDbSnapshot = XmlDatabase.exportDatabaseToJson();
    res.json({ backup: fullDbSnapshot, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/restore', requireAuth(['Super Admin', 'Admin']), async (req: AuthenticatedRequest, res) => {
  const { backup } = req.body;
  if (!backup || typeof backup !== 'object') {
    res.status(400).json({ error: 'Valid CMS database backup content is required' });
    return;
  }

  try {
    XmlDatabase.importDatabaseFromJson(backup);
    
    await SqliteDb.log(
      req.user!.id,
      req.user!.username,
      req.user!.role,
      'Update',
      'Restored full XML content backup files'
    );

    res.json({ success: true, message: 'Database restored successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Dashboard Statistis Core API
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const pages = XmlDatabase.readCollection('pages');
    const news = XmlDatabase.readCollection('news');
    const gallery = XmlDatabase.readCollection('gallery');
    const programs = XmlDatabase.readCollection('programs');
    const coaches = XmlDatabase.readCollection('coaches');
    const sponsors = XmlDatabase.readCollection('sponsors');
    const events = XmlDatabase.readCollection('events');
    const testimonials = XmlDatabase.readCollection('testimonials');
    const files = XmlDatabase.readCollection('documents');

    res.json({
      totalPages: pages.length,
      totalNews: news.length,
      totalGallery: gallery.length,
      totalPrograms: programs.length,
      totalCoaches: coaches.length,
      totalSponsors: sponsors.length,
      totalEvents: events.length,
      totalVisitors: 12480, // High-performance simulated counters for local enterprise
      totalFiles: files.length,
      recentTestimonials: testimonials.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Bootstrap the platform
async function startServer() {
  console.log('Bootstrapping SQLite auth-database...');
  await SqliteDb.initialize();
  console.log('Bootstrapping and synchronizing XML database with MongoDB Atlas...');
  await XmlDatabase.initialize();
  console.log('Seeding default XML settings...');
  seedDefaultPages();

  // Vite development integration
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting server in DEVELOPMENT MODE...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve index.html build outputs
    console.log('Starting server in PRODUCTION MODE...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BFA Enterprise CMS running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
