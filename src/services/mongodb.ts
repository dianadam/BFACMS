/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000,
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
};

// Use dummy fallback if MONGODB_URI is missing to prevent process crash upon startup
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/bfa_cms?connectTimeoutMS=1000&serverSelectionTimeoutMS=1000";

const client = new MongoClient(uri, options);

// Attach the client to ensure proper cleanup on function suspension
if (process.env.MONGODB_URI) {
  try {
    attachDatabasePool(client);
  } catch (err) {
    console.warn('attachDatabasePool could not be initialized:', err);
  }
}

let isConnected = false;

/**
 * Safely verify if MONGODB_URI is configured and the remote server is connectable.
 */
export async function checkAndConnect(): Promise<boolean> {
  const envUri = process.env.MONGODB_URI;
  if (!envUri) {
    isConnected = false;
    return false;
  }
  const trimmed = envUri.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
    isConnected = false;
    return false;
  }
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    isConnected = false;
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await client.connect();
    isConnected = true;
    return true;
  } catch (err) {
    console.error('[MongoDB] Connection check failed:', err);
    isConnected = false;
    return false;
  }
}

/**
 * Check if MongoDB is active and ready for database queries.
 */
export function isMongoActive(): boolean {
  return isConnected;
}

// Export a module-scoped MongoClient to ensure the client can be shared across functions.
export default client;
