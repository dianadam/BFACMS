/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { XMLRecord, MenuItem } from '../types';

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

// Simple Helpers for XML Escaping & CDATA
function escapeXmlValue(value: any): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // If the string contains XML characters, we will wrap it in CDATA dynamically
  if (/[<>&'"]/.test(str)) {
    // Escape CDATA end marker if present to avoid breaking CDATA blocks helper
    return `<![CDATA[${str.replace(/\]\]>/g, ']]&gt;')}]]>`;
  }
  return str;
}

function parseXmlValue(raw: string): string {
  if (!raw) return '';
  // Check CDATA wrap
  if (raw.startsWith('<![CDATA[') && raw.endsWith(']]>')) {
    return raw.substring(9, raw.length - 3).replace(/\]\]&gt;/g, ']]>');
  }
  // Simple XML Unescaping
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Custom High-Performance XML Parser specifically for BFA CMS records.
 * Robustly parses records, handling nesting and multi-line values safely.
 */
function deserializeXml(xmlText: string): XMLRecord[] {
  const records: XMLRecord[] = [];
  // Match every <record>...</record> segment
  const recordMatches = xmlText.match(/<record>([\s\S]*?)<\/record>/gi);
  if (!recordMatches) return [];

  for (const match of recordMatches) {
    // Extract contents of <record>
    const innerContent = match.replace(/<\/?record>/gi, '');
    const record: Partial<XMLRecord> = {};
    const seoMeta: Record<string, string> = {};

    // Standard Regular expression designed to extract tags along with their values, including CDATA
    const tagMatches = innerContent.matchAll(/<([a-z0-9_]+)>([\s\S]*?)<\/\1>/gi);
    
    for (const tagMatch of tagMatches) {
      const tagName = tagMatch[1];
      const tagVal = parseXmlValue(tagMatch[2].trim());

      // If the field belongs to SEO Meta, we group it
      if (['metaTitle', 'metaDescription', 'keywords', 'openGraphImage', 'schemaMarkup'].includes(tagName)) {
        seoMeta[tagName] = tagVal;
      } else {
        (record as any)[tagName] = tagVal;
      }
    }

    if (Object.keys(seoMeta).length > 0) {
      record.seoMeta = {
        metaTitle: seoMeta.metaTitle || '',
        metaDescription: seoMeta.metaDescription || '',
        keywords: seoMeta.keywords || '',
        openGraphImage: seoMeta.openGraphImage || '',
        schemaMarkup: seoMeta.schemaMarkup || '',
      };
    }

    if (record.id) {
      records.push(record as XMLRecord);
    }
  }

  return records;
}

/**
 * Convers XMLRecord list to Enterprise formatted XML with headers.
 */
function serializeXml(records: XMLRecord[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<records>\n';

  for (const record of records) {
    xml += '  <record>\n';
    
    // Core attributes
    xml += `    <id>${escapeXmlValue(record.id)}</id>\n`;
    xml += `    <slug>${escapeXmlValue(record.slug)}</slug>\n`;
    xml += `    <title>${escapeXmlValue(record.title)}</title>\n`;
    xml += `    <description>${escapeXmlValue(record.description)}</description>\n`;
    xml += `    <content>${escapeXmlValue(record.content)}</content>\n`;
    xml += `    <image>${escapeXmlValue(record.image)}</image>\n`;
    xml += `    <status>${escapeXmlValue(record.status)}</status>\n`;
    xml += `    <created_at>${escapeXmlValue(record.created_at)}</created_at>\n`;
    xml += `    <updated_at>${escapeXmlValue(record.updated_at)}</updated_at>\n`;

    // Dynamic Module attributes
    if (record.category) xml += `    <category>${escapeXmlValue(record.category)}</category>\n`;
    if (record.price) xml += `    <price>${escapeXmlValue(record.price)}</price>\n`;
    if (record.duration) xml += `    <duration>${escapeXmlValue(record.duration)}</duration>\n`;
    if (record.coach_id) xml += `    <coach_id>${escapeXmlValue(record.coach_id)}</coach_id>\n`;
    if (record.specialty) xml += `    <specialty>${escapeXmlValue(record.specialty)}</specialty>\n`;
    if (record.instagram) xml += `    <instagram>${escapeXmlValue(record.instagram)}</instagram>\n`;
    if (record.website) xml += `    <website>${escapeXmlValue(record.website)}</website>\n`;
    if (record.level) xml += `    <level>${escapeXmlValue(record.level)}</level>\n`;
    if (record.event_date) xml += `    <event_date>${escapeXmlValue(record.event_date)}</event_date>\n`;
    if (record.location) xml += `    <location>${escapeXmlValue(record.location)}</location>\n`;
    if (record.testimonial_author) xml += `    <testimonial_author>${escapeXmlValue(record.testimonial_author)}</testimonial_author>\n`;
    if (record.testimonial_role) xml += `    <testimonial_role>${escapeXmlValue(record.testimonial_role)}</testimonial_role>\n`;
    if (record.document_url) xml += `    <document_url>${escapeXmlValue(record.document_url)}</document_url>\n`;
    if (record.document_type) xml += `    <document_type>${escapeXmlValue(record.document_type)}</document_type>\n`;
    if (record.media_type) xml += `    <media_type>${escapeXmlValue(record.media_type)}</media_type>\n`;

    // SEO Meta attributes inside record
    if (record.seoMeta) {
      xml += `    <metaTitle>${escapeXmlValue(record.seoMeta.metaTitle)}</metaTitle>\n`;
      xml += `    <metaDescription>${escapeXmlValue(record.seoMeta.metaDescription)}</metaDescription>\n`;
      xml += `    <keywords>${escapeXmlValue(record.seoMeta.keywords)}</keywords>\n`;
      xml += `    <openGraphImage>${escapeXmlValue(record.seoMeta.openGraphImage)}</openGraphImage>\n`;
      xml += `    <schemaMarkup>${escapeXmlValue(record.seoMeta.schemaMarkup)}</schemaMarkup>\n`;
    }

    xml += '  </record>\n';
  }

  xml += '</records>';
  return xml;
}

export class XmlDatabase {
  private static getFilePath(filename: string): string {
    return path.join(DATA_DIR, `${filename}.xml`);
  }

  /**
   * Reads and parses a specific XML table completely offline.
   */
  public static readCollection(collectionName: string): XMLRecord[] {
    const filePath = this.getFilePath(collectionName);
    if (!fs.existsSync(filePath)) {
      // Bootstrap with an empty dataset
      this.writeCollection(collectionName, []);
      return [];
    }
    try {
      const xmlText = fs.readFileSync(filePath, 'utf-8');
      return deserializeXml(xmlText);
    } catch (err) {
      console.error(`Error reading XML collection ${collectionName}:`, err);
      return [];
    }
  }

  /**
   * Overwrites a collection's XML content.
   */
  public static writeCollection(collectionName: string, records: XMLRecord[]): void {
    const filePath = this.getFilePath(collectionName);
    try {
      const serialized = serializeXml(records);
      fs.writeFileSync(filePath, serialized, 'utf-8');
    } catch (err) {
      console.error(`Error writing XML collection ${collectionName}:`, err);
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
            r.title.toLowerCase().includes(text) ||
            r.description.toLowerCase().includes(text) ||
            r.content.toLowerCase().includes(text)
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
   * Global cross-repository search engine inside XML repository.
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
          r.title.toLowerCase().includes(text) ||
          r.description.toLowerCase().includes(text) ||
          r.content.toLowerCase().includes(text) ||
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
