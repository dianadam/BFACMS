/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User & Role Types
export type UserRole = 'Super Admin' | 'Admin' | 'Editor' | 'Coach' | 'Marketing';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: string;
  username: string;
  role: string;
  action: 'Login' | 'Logout' | 'Create' | 'Update' | 'Delete' | 'Publish';
  details: string;
  timestamp: string;
}

// SEO Meta Structure
export interface SEOMeta {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  openGraphImage: string;
  schemaMarkup: string;
}

// Drag & Drop Page Builder Blocks
export type BlockType =
  | 'Heading'
  | 'Paragraph'
  | 'Image'
  | 'Gallery'
  | 'Video'
  | 'Button'
  | 'Table'
  | 'Quote'
  | 'HTML Block'
  | 'Call To Action';

export interface PageBlock {
  id: string;
  type: BlockType;
  content: string; // Dynamic JSON stringified or raw text
  settings?: Record<string, any>;
}

// Generic XML Content Record
export interface XMLRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string; // Store serialised blocks for pages, or custom body
  image: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  
  // SEO Metadata (mostly for pages and posts)
  seoMeta?: SEOMeta;
  
  // Custom module-specific properties
  category?: string;       // news / program
  price?: string;          // program
  duration?: string;       // program
  coach_id?: string;       // program
  specialty?: string;      // coach
  instagram?: string;      // coach
  website?: string;        // sponsor
  level?: string;          // sponsor
  event_date?: string;     // event
  location?: string;       // event
  testimonial_author?: string; // testimonial
  testimonial_role?: string;   // testimonial
  document_url?: string;       // document
  document_type?: string;      // document (PDF, Word, Excel etc)
  media_type?: string;         // image / video
}

// File Upload Reference
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  category: 'images' | 'documents' | 'videos';
  uploadedAt: string;
}

// Menu Builder
export interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  parentId?: string;
}

// Dashboard KPIs
export interface DashboardStats {
  totalPages: number;
  totalNews: number;
  totalGallery: number;
  totalPrograms: number;
  totalCoaches: number;
  totalSponsors: number;
  totalEvents: number;
  totalVisitors: number;
  totalFiles: number;
}
