/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { XMLRecord, MenuItem } from '../types';
import client from './mongodb';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure uploads directories exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const SUB_DIRS = ['images', 'documents', 'videos'];
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
for (const sub of SUB_DIRS) {
  const p = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

let mongoDbName = 'bfa_cms';
if (process.env.MONGODB_URI) {
  try {
    const cleanUri = process.env.MONGODB_URI.split('?')[0];
    const match = cleanUri.match(/\/([a-zA-Z0-9_\-]+)$/);
    if (match && match[1]) {
      mongoDbName = match[1];
    }
  } catch (err) {
    // Keep default
  }
}

const getMongoDb = () => client.db(mongoDbName);

const COLLECTIONS = [
  'pages',
  'posts',
  'news',
  'gallery',
  'programs',
  'coaches',
  'sponsors',
  'events',
  'settings',
  'menus',
  'sliders',
  'documents',
  'testimonials'
];

export class XmlDatabase {
  private static cache: Record<string, XMLRecord[]> = {};
  private static isInitialized = false;

  private static getFilePath(filename: string): string {
    return path.join(DATA_DIR, `${filename}.json`);
  }

  public static isMongoEnabled(): boolean {
    return !!process.env.MONGODB_URI;
  }

  /**
   * Warm up and synchronize cache from MongoDB Atlas or local JSON files.
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.isMongoEnabled()) {
      try {
        console.log('[XmlDatabase] Synchronizing collections with MongoDB Atlas...');
        const db = getMongoDb();

        for (const col of COLLECTIONS) {
          const colRef = db.collection(col);
          const docs = await colRef.find({}).toArray();

          if (docs.length > 0) {
            this.cache[col] = docs.map((d: any) => {
              const { _id, ...rest } = d;
              return rest as XMLRecord;
            });
          } else {
            // First run migration: read from local backup if it has items
            const localRecords = this.readLocalFile(col);
            this.cache[col] = localRecords;
            if (localRecords.length > 0) {
              console.log(`[XmlDatabase] Migrating collection "${col}" to MongoDB Atlas...`);
              await colRef.insertMany(localRecords);
            }
          }
        }
        this.isInitialized = true;
        console.log('[XmlDatabase] Synchronization completed successfully.');
      } catch (err) {
        console.error('[XmlDatabase] MongoDB load error, falling back to local files:', err);
        this.initializeLocalFiles();
      }
    } else {
      this.initializeLocalFiles();
    }
  }

  private static initializeLocalFiles(): void {
    for (const col of COLLECTIONS) {
      this.cache[col] = this.readLocalFile(col);
    }
    this.isInitialized = true;
    console.log('[XmlDatabase] Offline local JSON datastore loaded.');
  }

  private static readLocalFile(collectionName: string): XMLRecord[] {
    const filePath = this.getFilePath(collectionName);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.trim() ? JSON.parse(content) : [];
    } catch (err) {
      console.error(`Error reading database collection local file ${collectionName}:`, err);
      return [];
    }
  }

  private static writeLocalFile(collectionName: string, records: XMLRecord[]): void {
    const filePath = this.getFilePath(collectionName);
    try {
      const serialized = JSON.stringify(records, null, 2);
      fs.writeFileSync(filePath, serialized, 'utf-8');
    } catch (err) {
      console.error(`Error writing database collection local file ${collectionName}:`, err);
    }
  }

  /**
   * Reads a specific collection from memory cache.
   */
  public static readCollection(collectionName: string): XMLRecord[] {
    if (!this.isInitialized) {
      this.initializeLocalFiles();
    }
    return this.cache[collectionName] || [];
  }

  /**
   * Overwrites a collection (Updates memory cache, backs up locally, and persists to MongoDB Atlas).
   */
  public static writeCollection(collectionName: string, records: XMLRecord[]): void {
    this.cache[collectionName] = records;
    this.writeLocalFile(collectionName, records);

    if (this.isMongoEnabled()) {
      const db = getMongoDb();
      const colRef = db.collection(collectionName);

      colRef.deleteMany({})
        .then(() => {
          if (records.length > 0) {
            return colRef.insertMany(records);
          }
        })
        .then(() => {
          console.log(`[XmlDatabase - Mongo] Saved collection: ${collectionName}`);
        })
        .catch((err) => {
          console.error(`[XmlDatabase - Mongo] Error syncing collection ${collectionName}:`, err);
        });
    }
  }

  /**
   * Appends or replaces a record in a collection (Upsert).
   */
  public static upsertRecord(collectionName: string, record: XMLRecord): void {
    const records = this.readCollection(collectionName);
    const existingIndex = records.findIndex(r => r.id === record.id);
    
    if (existingIndex !== -1) {
      records[existingIndex] = {
        ...records[existingIndex],
        ...record,
        updated_at: new Date().toISOString()
      };
    } else {
      records.push({
        ...record,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString()
      });
    }
    this.writeCollection(collectionName, records);
  }

  /**
   * Deletes a record from a collection by ID.
   */
  public static deleteRecord(collectionName: string, id: string): boolean {
    const records = this.readCollection(collectionName);
    const initialLen = records.length;
    const filtered = records.filter(r => r.id !== id);
    if (filtered.length !== initialLen) {
      this.writeCollection(collectionName, filtered);
      return true;
    }
    return false;
  }

  /**
   * Advanced query helper with filtering & sorting.
   */
  public static query(
    collectionName: string,
    filters?: Partial<XMLRecord> & { queryText?: string }
  ): XMLRecord[] {
    let records = this.readCollection(collectionName);

    if (filters) {
      // Full text search across title, content, description
      if (filters.queryText) {
        const text = filters.queryText.toLowerCase();
        records = records.filter(
          r =>
            (r.title || '').toLowerCase().includes(text) ||
            (r.description || '').toLowerCase().includes(text) ||
            (r.content || '').toLowerCase().includes(text)
        );
      }

      // Exact match properties (e.g. status, slug)
      for (const [key, val] of Object.entries(filters)) {
        if (key === 'queryText') continue;
        records = records.filter(r => (r as any)[key] === val);
      }
    }

    return records;
  }

  /**
   * Global cross-repository search engine inside database.
   */
  public static searchAll(queryText: string): Array<{ collection: string; record: XMLRecord }> {
    const collections = [
      'pages',
      'posts',
      'news',
      'gallery',
      'programs',
      'coaches',
      'sponsors',
      'events',
      'documents',
      'testimonials'
    ];
    const results: Array<{ collection: string; record: XMLRecord }> = [];
    const text = queryText.toLowerCase().trim();

    if (!text) return [];

    for (const col of collections) {
      const records = this.readCollection(col);
      const matched = records.filter(
        r =>
          (r.title || '').toLowerCase().includes(text) ||
          (r.description || '').toLowerCase().includes(text) ||
          (r.content || '').toLowerCase().includes(text) ||
          (r.slug && r.slug.toLowerCase().includes(text))
      );
      for (const r of matched) {
        results.push({ collection: col, record: r });
      }
    }

    return results;
  }

  /**
   * High performance file-backup helper.
   */
  public static exportDatabaseToJson(): Record<string, XMLRecord[]> {
    const collections = [
      'pages',
      'posts',
      'news',
      'gallery',
      'programs',
      'coaches',
      'sponsors',
      'events',
      'settings',
      'menus',
      'sliders',
      'documents',
      'testimonials'
    ];
    const database: Record<string, XMLRecord[]> = {};
    for (const col of collections) {
      database[col] = this.readCollection(col);
    }
    return database;
  }

  /**
   * High performance restore database helper.
   */
  public static importDatabaseFromJson(data: Record<string, XMLRecord[]>): void {
    for (const [col, records] of Object.entries(data)) {
      this.writeCollection(col, records);
    }
  }

  /**
   * Menu Builder operations helpers.
   */
  public static readMenu(): MenuItem[] {
    const records = this.readCollection('menus');
    if (records.length === 0) {
      // Seed default menu if empty
      const defaultMenus: MenuItem[] = [
        { id: 'm1', label: 'Home', url: '/', order: 1 },
        { id: 'm2', label: 'About', url: '/about', order: 2 },
        { id: 'm3', label: 'Programs', url: '/programs', order: 3 },
        { id: 'm4', label: 'Coaches', url: '/coaches', order: 4 },
        { id: 'm5', label: 'Gallery', url: '/gallery', order: 5 },
        { id: 'm6', label: 'Events', url: '/events', order: 6 },
        { id: 'm7', label: 'News & Articles', url: '/news', order: 7 },
        { id: 'm8', label: 'Contact', url: '/contact', order: 8 }
      ];
      const items: XMLRecord[] = defaultMenus.map(m => ({
        id: m.id,
        slug: m.id,
        title: m.label,
        description: m.url,
        content: String(m.order),
        image: m.parentId || '',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      this.writeCollection('menus', items);
      return defaultMenus;
    }

    return records.map(r => ({
      id: r.id,
      label: r.title,
      url: r.description,
      order: parseInt(r.content || '1', 10),
      parentId: r.image || undefined
    })).sort((a, b) => a.order - b.order);
  }

  public static saveMenu(items: MenuItem[]): void {
    const records: XMLRecord[] = items.map(m => ({
      id: m.id,
      slug: m.id,
      title: m.label,
      description: m.url,
      content: String(m.order),
      image: m.parentId || '',
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    this.writeCollection('menus', records);
  }
}
