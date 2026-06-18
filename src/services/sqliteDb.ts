/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { User, AuditLog, UserRole } from '../types';
import client from './mongodb';

const DB_DIR = path.join(process.cwd(), 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const USERS_PATH = path.join(DB_DIR, 'users.json');
const AUDIT_PATH = path.join(DB_DIR, 'audit_logs.json');

interface LocalUserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
}

interface LocalAuditRecord {
  id: number;
  user_id: string;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

// Extract database name from connection strings securely
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

export class SqliteDb {
  
  public static isMongoEnabled(): boolean {
    return !!process.env.MONGODB_URI;
  }

  public static async initialize(): Promise<void> {
    if (this.isMongoEnabled()) {
      try {
        console.log('[Database] Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('[Database] Connected to MongoDB successfully. Database name:', mongoDbName);
        await this.seedDefaultUsers();
      } catch (err) {
        console.error('[Database] MongoDB connection error. Cold starting fallback...', err);
        this.initializeLocalJson();
      }
    } else {
      this.initializeLocalJson();
    }
  }

  private static initializeLocalJson(): void {
    if (!fs.existsSync(USERS_PATH)) {
      fs.writeFileSync(USERS_PATH, JSON.stringify([]), 'utf-8');
    }
    if (!fs.existsSync(AUDIT_PATH)) {
      fs.writeFileSync(AUDIT_PATH, JSON.stringify([]), 'utf-8');
    }
    this.seedDefaultUsersLocal();
  }

  private static async seedDefaultUsers(): Promise<void> {
    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const usersCol = db.collection('users');
        const count = await usersCol.countDocuments();
        if (count > 0) {
          return;
        }

        const roles: Array<{ name: string; username: string; email: string }> = [
          { name: 'Super Admin', username: 'superadmin', email: 'superadmin@bfa.cms' },
          { name: 'Admin', username: 'admin', email: 'admin@bfa.cms' },
          { name: 'Editor', username: 'editor', email: 'editor@bfa.cms' },
          { name: 'Coach', username: 'coach', email: 'coach@bfa.cms' },
          { name: 'Marketing', username: 'marketing', email: 'marketing@bfa.cms' }
        ];

        const passwordHash = this.hashPassword('password123');
        const createdAt = new Date().toISOString();

        const newUsers: LocalUserRecord[] = roles.map((roleInfo) => ({
          id: crypto.randomUUID(),
          username: roleInfo.username,
          email: roleInfo.email,
          password_hash: passwordHash,
          role: roleInfo.name,
          created_at: createdAt
        }));

        await usersCol.insertMany(newUsers);
        console.log('[Database] Seeded default users to MongoDB collection.');
      } catch (err) {
        console.error('[Database] Error seeding users in MongoDB:', err);
      }
    } else {
      this.seedDefaultUsersLocal();
    }
  }

  private static seedDefaultUsersLocal(): void {
    const users = this.readUsersFile();
    if (users.length > 0) {
      return;
    }

    const roles: Array<{ name: string; username: string; email: string }> = [
      { name: 'Super Admin', username: 'superadmin', email: 'superadmin@bfa.cms' },
      { name: 'Admin', username: 'admin', email: 'admin@bfa.cms' },
      { name: 'Editor', username: 'editor', email: 'editor@bfa.cms' },
      { name: 'Coach', username: 'coach', email: 'coach@bfa.cms' },
      { name: 'Marketing', username: 'marketing', email: 'marketing@bfa.cms' }
    ];

    const passwordHash = this.hashPassword('password123');
    const createdAt = new Date().toISOString();

    const newUsers: LocalUserRecord[] = roles.map((roleInfo) => ({
      id: crypto.randomUUID(),
      username: roleInfo.username,
      email: roleInfo.email,
      password_hash: passwordHash,
      role: roleInfo.name,
      created_at: createdAt
    }));

    this.writeUsersFile(newUsers);
  }

  public static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private static readUsersFile(): LocalUserRecord[] {
    try {
      if (!fs.existsSync(USERS_PATH)) return [];
      const content = fs.readFileSync(USERS_PATH, 'utf-8');
      return content.trim() ? JSON.parse(content) : [];
    } catch (err) {
      console.error('Error reading users file:', err);
      return [];
    }
  }

  private static writeUsersFile(users: LocalUserRecord[]): void {
    try {
      fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing users file:', err);
    }
  }

  private static readAuditFile(): LocalAuditRecord[] {
    try {
      if (!fs.existsSync(AUDIT_PATH)) return [];
      const content = fs.readFileSync(AUDIT_PATH, 'utf-8');
      return content.trim() ? JSON.parse(content) : [];
    } catch (err) {
      console.error('Error reading audit logs file:', err);
      return [];
    }
  }

  private static writeAuditFile(logs: LocalAuditRecord[]): void {
    try {
      fs.writeFileSync(AUDIT_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing audit logs file:', err);
    }
  }

  // --- QUERY UTILITIES ---

  public static runQuery(sql: string, params: any[] = []): Promise<any> {
    return Promise.resolve({ lastID: 1, changes: 1 });
  }

  public static getQuery(sql: string, params: any[] = []): Promise<any> {
    return Promise.resolve(null);
  }

  public static allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return Promise.resolve([]);
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
    
    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const logsCol = db.collection('audit_logs');
        const count = await logsCol.countDocuments();
        
        const newLog = {
          id: count + 1,
          user_id: userId,
          username,
          role,
          action,
          details,
          timestamp
        };

        await logsCol.insertOne(newLog);
        console.log(`[AUDIT - Mongo] User ${username} (${role}): ${action} - ${details}`);
        return;
      } catch (err) {
        console.error('MongoDB Audit Logging failed, falling back to local file:', err);
      }
    }

    try {
      const logs = this.readAuditFile();
      const nextId = logs.reduce((max, log) => Math.max(max, log.id), 0) + 1;

      const newLog: LocalAuditRecord = {
        id: nextId,
        user_id: userId,
        username,
        role,
        action,
        details,
        timestamp
      };

      logs.push(newLog);
      this.writeAuditFile(logs);
      console.log(`[AUDIT - Local] User ${username} (${role}): ${action} - ${details}`);
    } catch (err) {
      console.error('Local Audit Logging failed:', err);
    }
  }

  public static async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const logs = await db.collection('audit_logs')
          .find({})
          .sort({ timestamp: -1 })
          .limit(500)
          .toArray();

        return logs.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          username: r.username,
          role: r.role,
          action: r.action,
          details: r.details,
          timestamp: r.timestamp
        }));
      } catch (err) {
        console.error('MongoDB fetch audit logs error, failing back to local:', err);
      }
    }

    const logs = this.readAuditFile();
    const sorted = [...logs].sort((a, b) => b.id - a.id).slice(0, 500);
    return sorted.map((r) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      role: r.role,
      action: r.action as any,
      details: r.details,
      timestamp: r.timestamp
    }));
  }

  // --- USER MANAGEMENT ---

  public static async authenticate(username: string, passwordPlain: string): Promise<User | null> {
    const hash = this.hashPassword(passwordPlain);
    const targetUsername = username.trim().toLowerCase();
    
    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const row = await db.collection('users').findOne({
          username: targetUsername,
          password_hash: hash
        }) as any;

        if (!row) return null;

        const user: User = {
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role as UserRole,
          createdAt: row.created_at
        };

        await this.log(user.id, user.username, user.role, 'Login', 'Log in successful via MongoDB');
        return user;
      } catch (err) {
        console.error('MongoDB authentication error, failing back to local:', err);
      }
    }

    const users = this.readUsersFile();
    const row = users.find(u => u.username.toLowerCase() === targetUsername && u.password_hash === hash);
    
    if (!row) return null;
    
    const user: User = {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role as UserRole,
      createdAt: row.created_at
    };

    await this.log(user.id, user.username, user.role, 'Login', 'Log in successful (Offline Backup)');
    return user;
  }

  public static async fetchUsers(): Promise<User[]> {
    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const users = await db.collection('users')
          .find({})
          .sort({ created_at: -1 })
          .toArray();

        return users.map((r: any) => ({
          id: r.id,
          username: r.username,
          email: r.email,
          role: r.role as UserRole,
          createdAt: r.created_at
        }));
      } catch (err) {
        console.error('MongoDB fetch users error, failing back to local:', err);
      }
    }

    const users = this.readUsersFile();
    const sorted = [...users].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return sorted.map((r) => ({
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
    const targetUsername = username.toLowerCase().trim();
    const targetEmail = email.toLowerCase().trim();

    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const usersCol = db.collection('users');
        
        const exists = await usersCol.findOne({
          $or: [
            { username: targetUsername },
            { email: targetEmail }
          ]
        });

        if (exists) {
          throw new Error('Username or email already exists');
        }

        const newUser = {
          id,
          username: targetUsername,
          email: targetEmail,
          password_hash: hash,
          role,
          created_at: createdAt
        };

        await usersCol.insertOne(newUser);

        await this.log(
          actor.id,
          actor.username,
          actor.role,
          'Create',
          `Registered new user: ${username} with role ${role} (MongoDB)`
        );

        return {
          id,
          username,
          email,
          role,
          createdAt
        };
      } catch (err: any) {
        if (err.message === 'Username or email already exists') throw err;
        console.error('MongoDB registration error, checking local backup:', err);
      }
    }

    const users = this.readUsersFile();
    const exists = users.some(u => u.username.toLowerCase() === targetUsername || u.email.toLowerCase() === targetEmail);
    if (exists) {
      throw new Error('Username or email already exists');
    }

    const newUser: LocalUserRecord = {
      id,
      username: targetUsername,
      email: targetEmail,
      password_hash: hash,
      role,
      created_at: createdAt
    };

    users.push(newUser);
    this.writeUsersFile(users);

    await this.log(
      actor.id,
      actor.username,
      actor.role,
      'Create',
      `Registered new user: ${username} with role ${role} (Offline Backup)`
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
    if (this.isMongoEnabled()) {
      try {
        const db = getMongoDb();
        const usersCol = db.collection('users');
        const target = await usersCol.findOne({ id }) as any;
        if (!target) return false;

        await usersCol.deleteOne({ id });

        await this.log(
          actor.id,
          actor.username,
          actor.role,
          'Delete',
          `Deleted user account: ${target.username} (${target.role}) (MongoDB)`
        );

        return true;
      } catch (err) {
        console.error('MongoDB delete user error, trying local backup:', err);
      }
    }

    const users = this.readUsersFile();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return false;

    const target = users[index];
    users.splice(index, 1);
    this.writeUsersFile(users);

    await this.log(
      actor.id,
      actor.username,
      actor.role,
      'Delete',
      `Deleted user account: ${target.username} (${target.role}) (Offline Backup)`
    );

    return true;
  }
}
