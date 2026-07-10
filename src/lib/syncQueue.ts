import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
  tasks: {
    key: string;
    value: any;
  };
  reports: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      type: 'SUBMIT_REPORT' | 'SUBMIT_OFFLINE_REPORT' | 'UPDATE_REPORT' | 'UPLOAD_EVIDENCE';
      payload: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('movit-offline-db', 1, {
      upgrade(db) {
        db.createObjectStore('tasks', { keyPath: 'id' });
        db.createObjectStore('reports', { keyPath: 'id' });
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

export async function cacheTasks(tasks: any[]) {
  const db = await getDB();
  const tx = db.transaction('tasks', 'readwrite');
  await tx.objectStore('tasks').clear();
  for (const task of tasks) {
    await tx.objectStore('tasks').put(task);
  }
  await tx.done;
}

export async function getCachedTasks() {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function cacheReports(reports: any[]) {
  const db = await getDB();
  const tx = db.transaction('reports', 'readwrite');
  await tx.objectStore('reports').clear();
  for (const report of reports) {
    await tx.objectStore('reports').put(report);
  }
  await tx.done;
}

export async function getCachedReports() {
  const db = await getDB();
  return db.getAll('reports');
}

export async function enqueueSync(type: 'SUBMIT_REPORT' | 'SUBMIT_OFFLINE_REPORT' | 'UPDATE_REPORT' | 'UPLOAD_EVIDENCE', payload: any) {
  const db = await getDB();
  await db.add('syncQueue', {
    type,
    payload,
    timestamp: Date.now()
  });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-timestamp');
}

export async function removeSyncItem(id: number) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function clearSyncQueue() {
  const db = await getDB();
  await db.clear('syncQueue');
}
