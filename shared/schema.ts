import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"),
  name: varchar("name", { length: 255 }),
  location: varchar("location", { length: 255 }),
  timezone: varchar("timezone", { length: 100 }),
  prayerMethod: varchar("prayer_method", { length: 100 }).default("ISNA"),
  madhab: varchar("madhab", { length: 50 }).default("Hanafi"),
  language: varchar("language", { length: 10 }).default("en"),
  darkMode: boolean("dark_mode").default(true),
  notifications: boolean("notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayers = pgTable("prayers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  time: timestamp("time").notNull(),
  completed: boolean("completed").default(false),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow(),
});

export const adhkar = pgTable("adhkar", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: text("title_ar"),
  textAr: text("text_ar").notNull(),
  textEn: text("text_en").notNull(),
  transliteration: text("transliteration"),
  category: varchar("category", { length: 100 }).notNull(),
  repetitions: integer("repetitions").default(1),
  audioUrl: varchar("audio_url", { length: 500 }),
  published: boolean("published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAdhkar = pgTable("user_adhkar", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  adhkarId: uuid("adhkar_id").references(() => adhkar.id).notNull(),
  completed: boolean("completed").default(false),
  currentCount: integer("current_count").default(0),
  date: varchar("date", { length: 10 }).notNull(),
  completedAt: timestamp("completed_at"),
});

export const timeBlocks = pgTable("time_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS format
  duration: integer("duration").notNull(), // minutes
  category: varchar("category", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  isTemplate: boolean("is_template").default(false),
  completed: boolean("completed").default(false),
  date: varchar("date", { length: 10 }), // null for templates
  tasks: jsonb("tasks").default([]), // array of task objects
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'prayer', 'adhkar', 'custom'
  title: varchar("title", { length: 255 }).notNull(),
  time: varchar("time", { length: 8 }).notNull(),
  enabled: boolean("enabled").default(true),
  recurring: varchar("recurring", { length: 20 }).default("daily"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPrayerSchema = createInsertSchema(prayers).omit({
  id: true,
  createdAt: true,
});

export const insertAdhkarSchema = createInsertSchema(adhkar).omit({
  id: true,
  createdAt: true,
});

export const insertTimeBlockSchema = createInsertSchema(timeBlocks).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Prayer = typeof prayers.$inferSelect;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type Adhkar = typeof adhkar.$inferSelect;
export type InsertAdhkar = z.infer<typeof insertAdhkarSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
