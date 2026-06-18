/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
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

// Export a module-scoped MongoClient to ensure the client can be shared across functions.
export default client;
