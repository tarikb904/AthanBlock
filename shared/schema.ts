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
  locationLat: text("location_lat"), // decimal latitude
  locationLon: text("location_lon"), // decimal longitude
  timezone: varchar("timezone", { length: 100 }),
  prayerMethod: integer("prayer_method").default(2), // Al-Adhan API method (ISNA=2)
  madhab: integer("madhab").default(1), // Al-Adhan API school (Hanafi=1)
  language: varchar("language", { length: 10 }).default("en"),
  darkMode: boolean("dark_mode").default(true),
  notifications: boolean("notifications").default(true),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prayer times from Al-Adhan API
export const prayerTimes = pgTable("prayer_times", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  fajr: varchar("fajr", { length: 8 }).notNull(), // HH:MM format
  sunrise: varchar("sunrise", { length: 8 }).notNull(),
  dhuhr: varchar("dhuhr", { length: 8 }).notNull(),
  asr: varchar("asr", { length: 8 }).notNull(),
  maghrib: varchar("maghrib", { length: 8 }).notNull(),
  isha: varchar("isha", { length: 8 }).notNull(),
  source: varchar("source", { length: 50 }).default("aladhan"), // API source
  prayerMethod: integer("prayer_method").notNull(), // method used for calculation
  madhab: integer("madhab").notNull(), // madhab used
  locationLat: text("location_lat").notNull(),
  locationLon: text("location_lon").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual prayer completion tracking
export const prayers = pgTable("prayers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  time: varchar("time", { length: 8 }).notNull(), // Changed to varchar for HH:MM format
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

// Daily templates (Barakah template, others) - moved up for reference
export const dailyTemplates = pgTable("daily_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // 'barakah', 'ramadan', 'hajj', 'student', 'working'
  isPublic: boolean("is_public").default(false),
  createdBy: uuid("created_by").references(() => users.id),
  blocks: jsonb("blocks").notNull(), // array of template block definitions
  tags: jsonb("tags").default([]), // array of tags for filtering
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(0), // 1-5 stars
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily plans (one per day per user)
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  title: varchar("title", { length: 255 }).default("Daily Plan"),
  completed: boolean("completed").default(false),
  totalBlocks: integer("total_blocks").default(0),
  completedBlocks: integer("completed_blocks").default(0),
  templateId: uuid("template_id").references(() => dailyTemplates.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Plan blocks (like Fajr, Work, Quran, etc.)
export const planBlocks = pgTable("plan_blocks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: uuid("plan_id").references(() => plans.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS format
  endTime: varchar("end_time", { length: 8 }).notNull(),
  duration: integer("duration").notNull(), // minutes
  category: varchar("category", { length: 100 }).notNull(), // 'prayer', 'work', 'adhkar', 'study', 'family'
  blockType: varchar("block_type", { length: 50 }).notNull(), // 'prayer', 'custom', 'template'
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  priority: integer("priority").default(1), // 1-5 scale
  completed: boolean("completed").default(false),
  orderIndex: integer("order_index").notNull(), // for reordering
  prayerName: varchar("prayer_name", { length: 50 }), // if block_type = 'prayer'
  adhkarId: uuid("adhkar_id").references(() => adhkar.id), // if category = 'adhkar'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Islamic Project Categories and Hierarchy
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // 'ibadah', 'dunya', 'family', 'work', 'learning'
  parentProjectId: uuid("parent_project_id").references(() => projects.id), // for hierarchy
  color: varchar("color", { length: 20 }).default("#3b82f6"),
  icon: varchar("icon", { length: 50 }).default("folder"),
  isArchived: boolean("is_archived").default(false),
  orderIndex: integer("order_index").default(0),
  sharedWithFamily: boolean("shared_with_family").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Smart Labels System
export const labels = pgTable("labels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(), // 'urgent', 'fard', 'sunnah', 'family', 'work', etc.
  color: varchar("color", { length: 20 }).notNull(),
  isSystemLabel: boolean("is_system_label").default(false), // true for built-in Islamic labels
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Advanced Tasks with Islamic Features
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Islamic Priority System
  islamicPriority: integer("islamic_priority").notNull().default(4), // 1=Fard, 2=Wajib, 3=Sunnah, 4=Nafl
  urgency: integer("urgency").default(3), // 1-5 scale
  
  // Status and Completion
  status: varchar("status", { length: 50 }).default("todo"), // 'todo', 'in_progress', 'review', 'completed', 'blocked'
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  
  // Scheduling
  dueDate: varchar("due_date", { length: 10 }), // YYYY-MM-DD
  dueDateHijri: varchar("due_date_hijri", { length: 20 }), // Islamic date
  scheduledTime: varchar("scheduled_time", { length: 8 }), // HH:MM:SS
  estimatedMinutes: integer("estimated_minutes"),
  actualMinutes: integer("actual_minutes"),
  
  // Recurrence
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: jsonb("recurrence_pattern"), // {type: 'daily', interval: 1, days: ['mon', 'tue']}
  nextDueDate: varchar("next_due_date", { length: 10 }),
  
  // Organization
  orderIndex: integer("order_index").default(0),
  parentTaskId: uuid("parent_task_id").references(() => tasks.id), // for subtasks
  
  // Collaboration
  comments: jsonb("comments").default([]), // array of comment objects
  attachments: jsonb("attachments").default([]), // array of attachment objects
  
  // Islamic Context
  prayerRelated: boolean("prayer_related").default(false),
  beforePrayer: varchar("before_prayer", { length: 50 }), // which prayer this should be done before
  afterPrayer: varchar("after_prayer", { length: 50 }), // which prayer this should be done after
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Labels Junction Table
export const taskLabels = pgTable("task_labels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  labelId: uuid("label_id").references(() => labels.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Templates for Islamic Routines
export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // 'morning_routine', 'evening_routine', 'friday_routine'
  islamicCategory: varchar("islamic_category", { length: 50 }), // 'fard', 'sunnah', 'nafl', 'adhkar'
  tasks: jsonb("tasks").notNull(), // array of task definitions
  isPublic: boolean("is_public").default(false),
  isSystemTemplate: boolean("is_system_template").default(false),
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(0),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Family/Team Collaboration
export const collaborations = pgTable("collaborations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  collaboratorId: uuid("collaborator_id").references(() => users.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  taskId: uuid("task_id").references(() => tasks.id),
  role: varchar("role", { length: 50 }).default("viewer"), // 'owner', 'editor', 'viewer'
  permissions: jsonb("permissions").default({}), // {canEdit: true, canAssign: true, canDelete: false}
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'accepted', 'declined'
});

// Activity Feed for Collaboration
export const activityFeed = pgTable("activity_feed", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  actorId: uuid("actor_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // 'task_created', 'task_completed', 'task_assigned'
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'task', 'project', 'prayer'
  entityId: uuid("entity_id").notNull(),
  metadata: jsonb("metadata"), // additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved Filters and Views
export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filterConfig: jsonb("filter_config").notNull(), // {status: ['todo'], priority: [1,2], labels: ['urgent']}
  viewType: varchar("view_type", { length: 50 }).default("list"), // 'list', 'board', 'calendar', 'timeline'
  isDefault: boolean("is_default").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Device tokens for push notifications
export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  deviceToken: text("device_token").notNull().unique(),
  deviceType: varchar("device_type", { length: 20 }).notNull(), // 'ios', 'android', 'web'
  deviceName: varchar("device_name", { length: 255 }),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications queue for pending notifications
export const notificationsQueue = pgTable("notifications_queue", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  deviceId: uuid("device_id").references(() => devices.id),
  type: varchar("type", { length: 50 }).notNull(), // 'prayer', 'adhkar', 'reminder', 'plan'
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  data: jsonb("data"), // additional payload data
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'sent', 'failed'
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});


// Analytics events (simple user events log)
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'prayer_completed', 'plan_created', 'adhkar_started'
  eventCategory: varchar("event_category", { length: 50 }).notNull(), // 'prayer', 'planning', 'adhkar', 'settings'
  eventAction: varchar("event_action", { length: 100 }).notNull(), // 'complete', 'start', 'edit', 'delete'
  eventLabel: varchar("event_label", { length: 255 }), // optional additional context
  value: integer("value"), // numeric value if applicable
  metadata: jsonb("metadata"), // additional event data
  deviceType: varchar("device_type", { length: 20 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
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

export const insertPrayerTimesSchema = createInsertSchema(prayerTimes).omit({
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

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});

export const insertPlanBlockSchema = createInsertSchema(planBlocks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertNotificationSchema = createInsertSchema(notificationsQueue).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertDailyTemplateSchema = createInsertSchema(dailyTemplates).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

// New schema inserts for Phase 1 & 2 features
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertLabelSchema = createInsertSchema(labels).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  usageCount: true,
  rating: true,
});

export const insertCollaborationSchema = createInsertSchema(collaborations).omit({
  id: true,
  invitedAt: true,
  acceptedAt: true,
});

export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({
  id: true,
  createdAt: true,
});

export const insertSavedFilterSchema = createInsertSchema(savedFilters).omit({
  id: true,
  createdAt: true,
});

export const insertTaskLabelSchema = createInsertSchema(taskLabels).omit({
  id: true,
  createdAt: true,
});

// Update existing task schema
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Prayer = typeof prayers.$inferSelect;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type PrayerTimes = typeof prayerTimes.$inferSelect;
export type InsertPrayerTimes = z.infer<typeof insertPrayerTimesSchema>;
export type Adhkar = typeof adhkar.$inferSelect;
export type InsertAdhkar = z.infer<typeof insertAdhkarSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type PlanBlock = typeof planBlocks.$inferSelect;
export type InsertPlanBlock = z.infer<typeof insertPlanBlockSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type NotificationQueue = typeof notificationsQueue.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type DailyTemplate = typeof dailyTemplates.$inferSelect;
export type InsertDailyTemplate = z.infer<typeof insertDailyTemplateSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// New types for Phase 1 & 2 features
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Label = typeof labels.$inferSelect;
export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type Collaboration = typeof collaborations.$inferSelect;
export type InsertCollaboration = z.infer<typeof insertCollaborationSchema>;
export type ActivityFeed = typeof activityFeed.$inferSelect;
export type InsertActivityFeed = z.infer<typeof insertActivityFeedSchema>;
export type SavedFilter = typeof savedFilters.$inferSelect;
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;
export type TaskLabel = typeof taskLabels.$inferSelect;
export type InsertTaskLabel = z.infer<typeof insertTaskLabelSchema>;

// Islamic Priority enum for type safety
export enum IslamicPriority {
  FARD = 1,
  WAJIB = 2,
  SUNNAH = 3,
  NAFL = 4,
}

// Task status enum
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress", 
  REVIEW = "review",
  COMPLETED = "completed",
  BLOCKED = "blocked",
}

// Islamic categories enum
export enum IslamicCategory {
  IBADAH = "ibadah",
  DUNYA = "dunya", 
  FAMILY = "family",
  WORK = "work",
  LEARNING = "learning",
}
