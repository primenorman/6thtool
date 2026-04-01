import Dexie, { type Table } from "dexie";

export interface PendingPractice {
  id?: number;
  data: Record<string, any>;
  createdAt: number;
}

export interface PendingXpAward {
  id?: number;
  eventType: string;
  description: string;
  createdAt: number;
}

export interface AppPreference {
  key: string;
  value: any;
}

class OfflineDatabase extends Dexie {
  pendingPractices!: Table<PendingPractice>;
  pendingXpAwards!: Table<PendingXpAward>;
  preferences!: Table<AppPreference>;

  constructor() {
    super("the6thtool");
    this.version(1).stores({
      pendingPractices: "++id, createdAt",
      pendingXpAwards: "++id, createdAt",
      preferences: "key",
    });
  }
}

export const offlineDb = new OfflineDatabase();

export async function queuePracticeSubmission(data: Record<string, any>) {
  await offlineDb.pendingPractices.add({ data, createdAt: Date.now() });
}

export async function queueXpAward(eventType: string, description: string) {
  await offlineDb.pendingXpAwards.add({ eventType, description, createdAt: Date.now() });
}

export async function getPendingPractices() {
  return offlineDb.pendingPractices.orderBy("createdAt").toArray();
}

export async function getPendingXpAwards() {
  return offlineDb.pendingXpAwards.orderBy("createdAt").toArray();
}

export async function clearPendingPractice(id: number) {
  await offlineDb.pendingPractices.delete(id);
}

export async function clearPendingXpAward(id: number) {
  await offlineDb.pendingXpAwards.delete(id);
}

export async function getPreference(key: string): Promise<any> {
  const pref = await offlineDb.preferences.get(key);
  return pref?.value;
}

export async function setPreference(key: string, value: any) {
  await offlineDb.preferences.put({ key, value });
}
