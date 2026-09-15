import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertTreasure, InsertUser, statusLogs, treasures, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

export type TreasureType = {
  id: number;
  name: string;
  islandName: string;
  latitude: number;
  longitude: number;
  value: number;
  terrain: string;
  burialDepth: number;
  status: "Found" | "Lost" | "Stolen";
  createdAt: Date;
  updatedAt: Date;
};

type InsertSeedTreasure = {
  name: string;
  islandName: string;
  latitude: number;
  longitude: number;
  value: number;
  terrain: string;
  burialDepth: number;
  status: "Found" | "Lost" | "Stolen";
};

const initialSeedTreasures: InsertSeedTreasure[] = [
  { name: "Emerald Crown", islandName: "Skull Island", latitude: 18.42, longitude: -66.08, value: 250000, terrain: "Jungle", burialDepth: 12, status: "Found" },
  { name: "Ruby Chalice", islandName: "Cursed Reef", latitude: 14.61, longitude: -61.03, value: 175000, terrain: "Reef", burialDepth: 8, status: "Lost" },
  { name: "Aztec Idol", islandName: "Jaguar Key", latitude: 12.18, longitude: -68.25, value: 300000, terrain: "Ruins", burialDepth: 20, status: "Stolen" },
  { name: "Golden Compass", islandName: "Whisper Island", latitude: 21.5, longitude: -77.78, value: 120000, terrain: "Cave", burialDepth: 5, status: "Found" },
  { name: "Sapphire Chest", islandName: "Shadow Atoll", latitude: 10.4, longitude: -76.54, value: 200000, terrain: "Atoll", burialDepth: 15, status: "Found" },
  { name: "Black Pearl Cache", islandName: "Midnight Isle", latitude: 16.75, longitude: -82.1, value: 95000, terrain: "Coastal", burialDepth: 10, status: "Lost" },
  { name: "Royal Doubloons", islandName: "Sunken Cay", latitude: 8.14, longitude: -81.3, value: 180000, terrain: "Cove", burialDepth: 18, status: "Stolen" },
  { name: "Dragon Relic", islandName: "Inferno Island", latitude: 9.72, longitude: -79.42, value: 220000, terrain: "Volcanic", burialDepth: 25, status: "Found" },

  // Indian Ocean Treasures (India & Sri Lanka)
  { name: "Malabar Sovereign Gold", islandName: "Malabar Coast (Kerala, India)", latitude: 10.85, longitude: 75.95, value: 450000, terrain: "Coastal", burialDepth: 14, status: "Found" },
  { name: "Ceylon Star Ruby", islandName: "Galle Fort (Sri Lanka)", latitude: 6.03, longitude: 80.21, value: 520000, terrain: "Reef", burialDepth: 9, status: "Lost" },
  { name: "Lakshadweep Emerald Isle", islandName: "Kavaratti Atoll (India)", latitude: 10.57, longitude: 72.64, value: 380000, terrain: "Atoll", burialDepth: 11, status: "Found" },
  { name: "Andaman Cursed Sapphire", islandName: "Port Blair (Andaman, India)", latitude: 11.62, longitude: 92.72, value: 600000, terrain: "Jungle", burialDepth: 22, status: "Stolen" },
  { name: "Trincomalee Galleon Cache", islandName: "Trincomalee Bay (Sri Lanka)", latitude: 8.58, longitude: 81.21, value: 340000, terrain: "Cove", burialDepth: 16, status: "Found" },
  { name: "Coromandel Jewel Chest", islandName: "Pulicat Lagoon (Tamil Nadu, India)", latitude: 13.41, longitude: 80.31, value: 290000, terrain: "Ruins", burialDepth: 18, status: "Lost" },
  { name: "Goa Portuguese Doubloons", islandName: "Mormugao Bay (Goa, India)", latitude: 15.4, longitude: 73.8, value: 410000, terrain: "Coastal", burialDepth: 10, status: "Found" },
];

let inMemoryTreasures: TreasureType[] = initialSeedTreasures.map((t, idx) => ({
  id: idx + 1,
  name: t.name,
  islandName: t.islandName,
  latitude: t.latitude,
  longitude: t.longitude,
  value: t.value,
  terrain: t.terrain ? String(t.terrain) : "Coastal",
  burialDepth: t.burialDepth ? Number(t.burialDepth) : 10,
  status: (t.status as "Found" | "Lost" | "Stolen") ?? "Found",
  createdAt: new Date(),
  updatedAt: new Date(),
}));

let inMemoryLogs: Array<{ id: number; treasureId: number; status: "Found" | "Lost" | "Stolen"; changedAt: Date }> = inMemoryTreasures.map((t, idx) => ({
  id: idx + 1,
  treasureId: t.id,
  status: t.status,
  changedAt: new Date(),
}));

let _db: ReturnType<typeof drizzle> | null = null;
let demoDataChecked = false;
let demoDataCheckPromise: Promise<void> | null = null;
// The one-time onboarding seed is guarded by a shared promise for concurrent dashboard queries.

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureDemoTreasures() {
  if (demoDataChecked) return;
  if (demoDataCheckPromise) return demoDataCheckPromise;
  demoDataCheckPromise = (async () => {
    const db = await getDb();
    if (!db) return;
    const existing = await db.select({ id: treasures.id, status: treasures.status }).from(treasures).limit(1);
    if (existing.length === 0) {
      await db.insert(treasures).values(initialSeedTreasures);
      const inserted = await db.select({ id: treasures.id, status: treasures.status }).from(treasures).orderBy(desc(treasures.id)).limit(initialSeedTreasures.length);
      if (inserted.length) {
        await db.insert(statusLogs).values(inserted.map((row) => ({ treasureId: row.id, status: row.status })));
      }
    } else {
      const existingLogs = await db.select({ id: statusLogs.id }).from(statusLogs).limit(1);
      if (existingLogs.length === 0) {
        const allExisting = await db.select({ id: treasures.id, status: treasures.status }).from(treasures);
        await db.insert(statusLogs).values(allExisting.map((row) => ({ treasureId: row.id, status: row.status })));
      }
    }
    demoDataChecked = true;
  })().finally(() => {
    demoDataCheckPromise = null;
  });
  return demoDataCheckPromise;
}

export async function listTreasures() {
  const db = await getDb();
  if (!db) {
    return [...inMemoryTreasures].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  await ensureDemoTreasures();
  return db.select().from(treasures).orderBy(desc(treasures.updatedAt), asc(treasures.name));
}

export async function getTreasure(id: number) {
  const db = await getDb();
  if (!db) {
    return inMemoryTreasures.find((t) => t.id === id);
  }
  const rows = await db.select().from(treasures).where(eq(treasures.id, id)).limit(1);
  return rows[0];
}

export async function getStatusHistory(treasureId: number) {
  const db = await getDb();
  if (!db) {
    return inMemoryLogs.filter((log) => log.treasureId === treasureId).sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
  }
  return db.select().from(statusLogs).where(eq(statusLogs.treasureId, treasureId)).orderBy(asc(statusLogs.changedAt));
}

export async function getStats() {
  const db = await getDb();
  const rows = await listTreasures();
  const counts = { Found: 0, Lost: 0, Stolen: 0 };
  const islands = new Map<string, number>();
  let totalValue = 0;
  rows.forEach((row) => {
    counts[row.status] += 1;
    totalValue += row.value;
    islands.set(row.islandName, (islands.get(row.islandName) ?? 0) + row.value);
  });
  const mostValuableIsland = Array.from(islands.entries()).sort((a, b) => b[1] - a[1])[0];
  const recentActivity = rows.slice(0, 4).map((row) => ({ id: row.id, name: row.name, islandName: row.islandName, status: row.status, updatedAt: row.updatedAt, createdAt: row.createdAt }));
  return { total: rows.length, totalValue, counts, mostValuableIsland: mostValuableIsland ? { name: mostValuableIsland[0], value: mostValuableIsland[1] } : null, recentActivity };
}

export async function createTreasure(payload: InsertTreasure) {
  const db = await getDb();
  if (!db) {
    const newId = inMemoryTreasures.length ? Math.max(...inMemoryTreasures.map((t) => t.id)) + 1 : 1;
    const newTreasure: TreasureType = {
      id: newId,
      name: payload.name,
      islandName: payload.islandName,
      latitude: payload.latitude ?? 0,
      longitude: payload.longitude ?? 0,
      value: payload.value ?? 0,
      terrain: payload.terrain ? String(payload.terrain) : "Coastal",
      burialDepth: payload.burialDepth ? Number(payload.burialDepth) : 10,
      status: (payload.status as "Found" | "Lost" | "Stolen") ?? "Found",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryTreasures.unshift(newTreasure);
    inMemoryLogs.push({ id: inMemoryLogs.length + 1, treasureId: newId, status: newTreasure.status, changedAt: new Date() });
    return newTreasure;
  }
  const created = await db.insert(treasures).values(payload).$returningId();
  const id = created[0]?.id;
  if (!id) throw new Error("Treasure could not be created");
  await db.insert(statusLogs).values({ treasureId: id, status: payload.status ?? "Found" });
  return getTreasure(id);
}

export async function updateTreasure(id: number, payload: Partial<InsertTreasure>, statusChanged: boolean) {
  const db = await getDb();
  if (!db) {
    const target = inMemoryTreasures.find((t) => t.id === id);
    if (!target) throw new Error("Treasure not found");
    Object.assign(target, payload, { updatedAt: new Date() });
    if (statusChanged && payload.status) {
      inMemoryLogs.push({ id: inMemoryLogs.length + 1, treasureId: id, status: payload.status, changedAt: new Date() });
    }
    return target;
  }
  await db.update(treasures).set(payload).where(eq(treasures.id, id));
  if (statusChanged && payload.status) await db.insert(statusLogs).values({ treasureId: id, status: payload.status });
  return getTreasure(id);
}

export async function deleteTreasure(id: number) {
  const db = await getDb();
  if (!db) {
    inMemoryTreasures = inMemoryTreasures.filter((t) => t.id !== id);
    inMemoryLogs = inMemoryLogs.filter((log) => log.treasureId !== id);
    return;
  }
  await db.delete(statusLogs).where(eq(statusLogs.treasureId, id));
  await db.delete(treasures).where(eq(treasures.id, id));
}
