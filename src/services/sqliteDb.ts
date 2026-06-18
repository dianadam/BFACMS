/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { User, AuditLog, UserRole } from '../types';

const DB_DIR = path.join(process.cwd(), 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'auth.db');

export class SqliteDb {
  private static db: sqlite3.Database;

  public static initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Failed to open SQLite database:', err);
          reject(err);
          return;
        }

        // Streamline SQLite settings for concurrent and high-speed write/read performance
        this.db.serialize(() => {
          this.db.run('PRAGMA journal_mode = WAL;');
          this.db.run('PRAGMA synchronous = NORMAL;');

          // Initialize Tables & Seed Users
          this.createTables()
            .then(() => this.seedDefaultUsers())
            .then(() => resolve())
            .catch(reject);
        });
      });
    });
  }

  private static createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Users Table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `, (err) => { if (err) reject(err); });

        // Audit Logs Table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            timestamp TEXT NOT NULL
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  private static seedDefaultUsers(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as count FROM users', [], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (row && row.count > 0) {
          resolve();
          return;
        }

        const roles: Array<{ name: string; username: string; email: string }> = [
          { name: 'Super Admin', username: 'superadmin', email: 'superadmin@bfa.cms' },
          { name: 'Admin', username: 'admin', email: 'admin@bfa.cms' },
          { name: 'Editor', username: 'editor', email: 'editor@bfa.cms' },
          { name: 'Coach', username: 'coach', email: 'coach@bfa.cms' },
          { name: 'Marketing', username: 'marketing', email: 'marketing@bfa.cms' }
        ];

        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION');
          const stmt = this.db.prepare(`
            INSERT INTO users (id, username, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `);

          const passwordHash = this.hashPassword('password123');
          const createdAt = new Date().toISOString();

          for (const roleInfo of roles) {
            const id = crypto.randomUUID();
            stmt.run([id, roleInfo.username, roleInfo.email, passwordHash, roleInfo.name, createdAt]);
          }

          stmt.finalize();
          this.db.run('COMMIT', (commitErr) => {
            if (commitErr) reject(commitErr);
            else resolve();
          });
        });
      });
    });
  }

  public static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // --- QUERY UTILITIES ---

  public static runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  public static getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  public static allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // --- AUDIT SYSTEM ---

  public static async log(
    userId: string,
    username: string,
    role: string,
    action: AuditLog['action'],
    details: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const sql = `
      INSERT INTO audit_logs (user_id, username, role, action, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    try {
      await this.runQuery(sql, [userId, username, role, action, details, timestamp]);
      console.log(`[AUDIT] User ${username} (${role}): ${action} - ${details}`);
    } catch (err) {
      console.error('Audit Logging failed:', err);
    }
  }

  public static async getAuditLogs(): Promise<AuditLog[]> {
    const sql = 'SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500';
    const rows = await this.allQuery(sql);
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      role: r.role,
      action: r.action,
      details: r.details,
      timestamp: r.timestamp
    }));
  }

  // --- USER MANAGEMENT ---

  public static async authenticate(username: string, passwordPlain: string): Promise<User | null> {
    const hash = this.hashPassword(passwordPlain);
    const sql = 'SELECT * FROM users WHERE username = ? AND password_hash = ?';
    const row = await this.getQuery(sql, [username.trim().toLowerCase(), hash]);
    
    if (!row) return null;
    
    const user: User = {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role as UserRole,
      createdAt: row.created_at
    };

    // Automatically log this audit event
    await this.log(user.id, user.username, user.role, 'Login', 'Log in successful');

    return user;
  }

  public static async fetchUsers(): Promise<User[]> {
    const sql = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';
    const rows = await this.allQuery(sql);
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      role: r.role as UserRole,
      createdAt: r.created_at
    }));
  }

  public static async registerUser(
    username: string,
    email: string,
    passwordPlain: string,
    role: UserRole,
    actor: { id: string; username: string; role: string }
  ): Promise<User> {
    const id = crypto.randomUUID();
    const hash = this.hashPassword(passwordPlain);
    const createdAt = new Date().toISOString();

    const sql = `
      INSERT INTO users (id, username, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.runQuery(sql, [id, username.toLowerCase().trim(), email.toLowerCase().trim(), hash, role, createdAt]);

    await this.log(
      actor.id,
      actor.username,
      actor.role,
      'Create',
      `Registered new user: ${username} with role ${role}`
    );

    return {
      id,
      username,
      email,
      role,
      createdAt
    };
  }

  public static async deleteUser(id: string, actor: { id: string; username: string; role: string }): Promise<boolean> {
    const target = await this.getQuery('SELECT username, role FROM users WHERE id = ?', [id]);
    if (!target) return false;

    await this.runQuery('DELETE FROM users WHERE id = ?', [id]);
    await this.log(
      actor.id,
      actor.username,
      actor.role,
      'Delete',
      `Deleted user account: ${target.username} (${target.role})`
    );

    return true;
  }
}
