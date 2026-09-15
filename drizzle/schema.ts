import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, double } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const treasures = mysqlTable("treasures", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  islandName: varchar("islandName", { length: 100 }).notNull(),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  value: int("value").default(0).notNull(),
  terrain: varchar("terrain", { length: 50 }).default("Coastal"),
  burialDepth: double("burialDepth").default(0),
  status: mysqlEnum("status", ["Found", "Lost", "Stolen"]).default("Found").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const statusLogs = mysqlTable("statusLogs", {
  id: int("id").autoincrement().primaryKey(),
  treasureId: int("treasureId").notNull(),
  status: mysqlEnum("status", ["Found", "Lost", "Stolen"]).notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Treasure = typeof treasures.$inferSelect;
export type StatusLog = typeof statusLogs.$inferSelect;
export type InsertTreasure = typeof treasures.$inferInsert;
