import { 
  type User, 
  type InsertUser, 
  type Prayer, 
  type InsertPrayer,
  type PrayerTimes,
  type InsertPrayerTimes,
  type Adhkar,
  type InsertAdhkar,
  type TimeBlock,
  type InsertTimeBlock,
  type Reminder,
  type InsertReminder,
  users,
  prayers,
  prayerTimes,
  adhkar,
  timeBlocks,
  reminders
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";

// MemStorage as fallback implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private prayers: Map<string, Prayer> = new Map();
  private prayerTimesList: Map<string, PrayerTimes> = new Map();
  private adhkarList: Map<string, Adhkar> = new Map();
  private timeBlocksList: Map<string, TimeBlock> = new Map();
  private remindersList: Map<string, Reminder> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Add default adhkar
    const defaultAdhkar: Adhkar[] = [
      {
        id: randomUUID(),
        titleEn: "Ayat al-Kursi",
        titleAr: "آية الكرسي",
        textAr: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
        textEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.",
        transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum...",
        category: "morning",
        repetitions: 1,
        audioUrl: null,
        published: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        titleEn: "Tasbih",
        titleAr: "التسبيح",
        textAr: "سُبْحَانَ اللَّهِ",
        textEn: "Glory be to Allah",
        transliteration: "Subhan Allah",
        category: "morning",
        repetitions: 33,
        audioUrl: null,
        published: true,
        createdAt: new Date(),
      }
    ];

    defaultAdhkar.forEach(adhkar => this.adhkarList.set(adhkar.id, adhkar));

    // Add default time block templates
    const defaultTemplates: TimeBlock[] = [
      {
        id: randomUUID(),
        userId: "template",
        title: "Fajr Prayer",
        description: "Dawn prayer with morning adhkar",
        startTime: "05:23:00",
        duration: 30,
        category: "prayer",
        icon: "sun",
        color: "primary",
        isTemplate: true,
        completed: false,
        date: null,
        tasks: [],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: "template",
        title: "Dhuhr Prayer & Break",
        description: "Midday prayer and mindful break",
        startTime: "12:15:00",
        duration: 45,
        category: "prayer",
        icon: "sun",
        color: "primary",
        isTemplate: true,
        completed: false,
        date: null,
        tasks: [],
        createdAt: new Date(),
      }
    ];

    defaultTemplates.forEach(template => this.timeBlocksList.set(template.id, template));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      name: insertUser.name || null,
      email: insertUser.email,
      password: insertUser.password || null,
      location: insertUser.location || null,
      timezone: insertUser.timezone || null,
      prayerMethod: insertUser.prayerMethod || null,
      madhab: insertUser.madhab || null,
      language: insertUser.language || null,
      darkMode: insertUser.darkMode || null,
      notifications: insertUser.notifications || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Prayer operations
  async getPrayersForUserAndDate(userId: string, date: string): Promise<Prayer[]> {
    return Array.from(this.prayers.values()).filter(
      prayer => prayer.userId === userId && prayer.date === date
    );
  }

  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    const id = randomUUID();
    const prayer: Prayer = {
      id,
      date: insertPrayer.date,
      name: insertPrayer.name,
      userId: insertPrayer.userId,
      time: insertPrayer.time,
      completed: insertPrayer.completed || null,
      createdAt: new Date()
    };
    this.prayers.set(id, prayer);
    return prayer;
  }

  async updatePrayer(id: string, updates: Partial<InsertPrayer>): Promise<Prayer | undefined> {
    const prayer = this.prayers.get(id);
    if (!prayer) return undefined;
    const updatedPrayer = { ...prayer, ...updates };
    this.prayers.set(id, updatedPrayer);
    return updatedPrayer;
  }

  async createDailyPrayers(userId: string, date: string, prayerData: Omit<InsertPrayer, 'userId' | 'date'>[]): Promise<Prayer[]> {
    const createdPrayers: Prayer[] = [];
    for (const prayer of prayerData) {
      const created = await this.createPrayer({ ...prayer, userId, date });
      createdPrayers.push(created);
    }
    return createdPrayers;
  }

  // Prayer Times operations (Al-Adhan API integration)
  async getPrayerTimesForUserAndDate(userId: string, date: string): Promise<PrayerTimes | undefined> {
    return Array.from(this.prayerTimesList.values()).find(
      pt => pt.userId === userId && pt.date === date
    );
  }

  async createPrayerTimes(insertPrayerTimes: InsertPrayerTimes): Promise<PrayerTimes> {
    const id = randomUUID();
    const prayerTimes: PrayerTimes = {
      id,
      userId: insertPrayerTimes.userId,
      date: insertPrayerTimes.date,
      fajr: insertPrayerTimes.fajr,
      sunrise: insertPrayerTimes.sunrise,
      dhuhr: insertPrayerTimes.dhuhr,
      asr: insertPrayerTimes.asr,
      maghrib: insertPrayerTimes.maghrib,
      isha: insertPrayerTimes.isha,
      source: insertPrayerTimes.source || 'aladhan',
      prayerMethod: insertPrayerTimes.prayerMethod,
      madhab: insertPrayerTimes.madhab,
      locationLat: insertPrayerTimes.locationLat,
      locationLon: insertPrayerTimes.locationLon,
      createdAt: new Date()
    };
    this.prayerTimesList.set(id, prayerTimes);
    return prayerTimes;
  }

  async updatePrayerTimes(id: string, updates: Partial<InsertPrayerTimes>): Promise<PrayerTimes | undefined> {
    const prayerTimes = this.prayerTimesList.get(id);
    if (!prayerTimes) return undefined;
    const updatedPrayerTimes = { ...prayerTimes, ...updates };
    this.prayerTimesList.set(id, updatedPrayerTimes);
    return updatedPrayerTimes;
  }

  // Adhkar operations
  async getAllAdhkar(): Promise<Adhkar[]> {
    return Array.from(this.adhkarList.values()).filter(adhkar => adhkar.published);
  }

  async getAdhkarByCategory(category: string): Promise<Adhkar[]> {
    return Array.from(this.adhkarList.values()).filter(
      adhkar => adhkar.category === category && adhkar.published
    );
  }

  async createAdhkar(insertAdhkar: InsertAdhkar): Promise<Adhkar> {
    const id = randomUUID();
    const adhkar: Adhkar = { ...insertAdhkar, id, createdAt: new Date() };
    this.adhkarList.set(id, adhkar);
    return adhkar;
  }

  async updateAdhkar(id: string, updates: Partial<InsertAdhkar>): Promise<Adhkar | undefined> {
    const adhkar = this.adhkarList.get(id);
    if (!adhkar) return undefined;
    const updatedAdhkar = { ...adhkar, ...updates };
    this.adhkarList.set(id, updatedAdhkar);
    return updatedAdhkar;
  }

  async deleteAdhkar(id: string): Promise<boolean> {
    return this.adhkarList.delete(id);
  }

  // Time block operations
  async getTimeBlocksForUserAndDate(userId: string, date: string): Promise<TimeBlock[]> {
    return Array.from(this.timeBlocksList.values()).filter(
      block => block.userId === userId && block.date === date
    );
  }

  async getTimeBlockTemplates(): Promise<TimeBlock[]> {
    return Array.from(this.timeBlocksList.values()).filter(block => block.isTemplate);
  }

  async createTimeBlock(insertTimeBlock: InsertTimeBlock): Promise<TimeBlock> {
    const id = randomUUID();
    const timeBlock: TimeBlock = { ...insertTimeBlock, id, createdAt: new Date() };
    this.timeBlocksList.set(id, timeBlock);
    return timeBlock;
  }

  async updateTimeBlock(id: string, updates: Partial<InsertTimeBlock>): Promise<TimeBlock | undefined> {
    const timeBlock = this.timeBlocksList.get(id);
    if (!timeBlock) return undefined;
    const updatedTimeBlock = { ...timeBlock, ...updates };
    this.timeBlocksList.set(id, updatedTimeBlock);
    return updatedTimeBlock;
  }

  async deleteTimeBlock(id: string): Promise<boolean> {
    return this.timeBlocksList.delete(id);
  }

  async copyTemplateToDate(userId: string, date: string): Promise<TimeBlock[]> {
    const templates = await this.getTimeBlockTemplates();
    const copiedBlocks: TimeBlock[] = [];
    for (const template of templates) {
      const newBlock = await this.createTimeBlock({
        ...template,
        userId,
        date,
        isTemplate: false,
        completed: false
      });
      copiedBlocks.push(newBlock);
    }
    return copiedBlocks;
  }

  // Reminder operations
  async getRemindersForUser(userId: string): Promise<Reminder[]> {
    return Array.from(this.remindersList.values()).filter(
      reminder => reminder.userId === userId
    );
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = { ...insertReminder, id, createdAt: new Date() };
    this.remindersList.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const reminder = this.remindersList.get(id);
    if (!reminder) return undefined;
    const updatedReminder = { ...reminder, ...updates };
    this.remindersList.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: string): Promise<boolean> {
    return this.remindersList.delete(id);
  }
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Prayer operations
  getPrayersForUserAndDate(userId: string, date: string): Promise<Prayer[]>;
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  updatePrayer(id: string, updates: Partial<InsertPrayer>): Promise<Prayer | undefined>;
  createDailyPrayers(userId: string, date: string, prayers: Omit<InsertPrayer, 'userId' | 'date'>[]): Promise<Prayer[]>;

  // Prayer Times operations (Al-Adhan API integration)
  getPrayerTimesForUserAndDate(userId: string, date: string): Promise<PrayerTimes | undefined>;
  createPrayerTimes(prayerTimes: InsertPrayerTimes): Promise<PrayerTimes>;
  updatePrayerTimes(id: string, updates: Partial<InsertPrayerTimes>): Promise<PrayerTimes | undefined>;

  // Adhkar operations
  getAllAdhkar(): Promise<Adhkar[]>;
  getAdhkarByCategory(category: string): Promise<Adhkar[]>;
  createAdhkar(adhkar: InsertAdhkar): Promise<Adhkar>;
  updateAdhkar(id: string, updates: Partial<InsertAdhkar>): Promise<Adhkar | undefined>;
  deleteAdhkar(id: string): Promise<boolean>;

  // Time block operations
  getTimeBlocksForUserAndDate(userId: string, date: string): Promise<TimeBlock[]>;
  getTimeBlockTemplates(): Promise<TimeBlock[]>;
  createTimeBlock(timeBlock: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(id: string, updates: Partial<InsertTimeBlock>): Promise<TimeBlock | undefined>;
  deleteTimeBlock(id: string): Promise<boolean>;
  copyTemplateToDate(userId: string, date: string): Promise<TimeBlock[]>;

  // Reminder operations
  getRemindersForUser(userId: string): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: string): Promise<boolean>;
}

// Initialize PostgreSQL client
let db: any;
let sql: any;

try {
  if (process.env.DATABASE_URL) {
    sql = postgres(process.env.DATABASE_URL);
    db = drizzle(sql);
    console.log('Connected to PostgreSQL database');
  } else {
    console.log('Database URL not configured, using fallback storage');
    db = null;
  }
} catch (error) {
  console.error('Failed to initialize database:', error);
  db = null;
}

export class DrizzleStorage implements IStorage {
  private memoryFallback: MemStorage;

  constructor() {
    this.memoryFallback = new MemStorage();
    // Initialize default data in the background if database is available
    if (db) {
      this.ensureDefaultData().catch(console.error);
    }
  }

  private async ensureDefaultData() {
    try {
      // Check if we have any adhkar, if not add some default ones
      const existingAdhkar = await this.getAllAdhkar();
      if (existingAdhkar.length === 0) {
        await this.createDefaultAdhkar();
      }

      // Check if we have templates, if not add some default ones
      const existingTemplates = await this.getTimeBlockTemplates();
      if (existingTemplates.length === 0) {
        await this.createDefaultTemplates();
      }
    } catch (error) {
      console.error('Failed to initialize default data:', error);
    }
  }

  private async createDefaultAdhkar() {
    const defaultAdhkar = [
      {
        titleEn: "Ayat al-Kursi",
        titleAr: "آية الكرسي",
        textAr: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
        textEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence.",
        transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum...",
        category: "morning",
        repetitions: 1,
        published: true,
      },
      {
        titleEn: "Tasbih",
        titleAr: "التسبيح", 
        textAr: "سُبْحَانَ اللَّهِ",
        textEn: "Glory be to Allah",
        transliteration: "Subhan Allah",
        category: "morning",
        repetitions: 33,
        published: true,
      }
    ];

    for (const adhkar of defaultAdhkar) {
      await this.createAdhkar(adhkar);
    }
  }

  private async createDefaultTemplates() {
    // Skip creating templates for now to avoid UUID issues
    // Templates can be created later with proper user IDs
    console.log('Default templates creation skipped');
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return this.memoryFallback.getUser(id);
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getUser(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) return this.memoryFallback.getUserByEmail(email);
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getUserByEmail(email);
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!db) return this.memoryFallback.createUser(insertUser);
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.createUser(insertUser);
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    if (!db) return this.memoryFallback.updateUser(id, updates);
    try {
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.updateUser(id, updates);
    }
  }

  // Prayer operations
  async getPrayersForUserAndDate(userId: string, date: string): Promise<Prayer[]> {
    if (!db) return this.memoryFallback.getPrayersForUserAndDate(userId, date);
    try {
      return await db.select().from(prayers)
        .where(and(eq(prayers.userId, userId), eq(prayers.date, date)));
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getPrayersForUserAndDate(userId, date);
    }
  }

  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    if (!db) return this.memoryFallback.createPrayer(insertPrayer);
    try {
      const result = await db.insert(prayers).values(insertPrayer).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.createPrayer(insertPrayer);
    }
  }

  async updatePrayer(id: string, updates: Partial<InsertPrayer>): Promise<Prayer | undefined> {
    if (!db) return this.memoryFallback.updatePrayer(id, updates);
    try {
      const result = await db.update(prayers).set(updates).where(eq(prayers.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.updatePrayer(id, updates);
    }
  }

  async createDailyPrayers(userId: string, date: string, prayerData: Omit<InsertPrayer, 'userId' | 'date'>[]): Promise<Prayer[]> {
    if (!db) return this.memoryFallback.createDailyPrayers(userId, date, prayerData);
    try {
      const prayersToInsert = prayerData.map(prayer => ({
        ...prayer,
        userId,
        date
      }));
      
      return await db.insert(prayers).values(prayersToInsert).returning();
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.createDailyPrayers(userId, date, prayerData);
    }
  }

  // Adhkar operations
  async getAllAdhkar(): Promise<Adhkar[]> {
    if (!db) return this.memoryFallback.getAllAdhkar();
    try {
      return await db.select().from(adhkar).where(eq(adhkar.published, true));
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getAllAdhkar();
    }
  }

  async getAdhkarByCategory(category: string): Promise<Adhkar[]> {
    if (!db) return this.memoryFallback.getAdhkarByCategory(category);
    try {
      return await db.select().from(adhkar)
        .where(and(eq(adhkar.category, category), eq(adhkar.published, true)));
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getAdhkarByCategory(category);
    }
  }

  async createAdhkar(insertAdhkar: InsertAdhkar): Promise<Adhkar> {
    if (!db) return this.memoryFallback.createAdhkar(insertAdhkar);
    try {
      const result = await db.insert(adhkar).values(insertAdhkar).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.createAdhkar(insertAdhkar);
    }
  }

  async updateAdhkar(id: string, updates: Partial<InsertAdhkar>): Promise<Adhkar | undefined> {
    if (!db) return this.memoryFallback.updateAdhkar(id, updates);
    try {
      const result = await db.update(adhkar).set(updates).where(eq(adhkar.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.updateAdhkar(id, updates);
    }
  }

  async deleteAdhkar(id: string): Promise<boolean> {
    if (!db) return this.memoryFallback.deleteAdhkar(id);
    try {
      const result = await db.delete(adhkar).where(eq(adhkar.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.deleteAdhkar(id);
    }
  }

  // Time block operations
  async getTimeBlocksForUserAndDate(userId: string, date: string): Promise<TimeBlock[]> {
    return await db.select().from(timeBlocks)
      .where(and(eq(timeBlocks.userId, userId), eq(timeBlocks.date, date)));
  }

  async getTimeBlockTemplates(): Promise<TimeBlock[]> {
    return await db.select().from(timeBlocks).where(eq(timeBlocks.isTemplate, true));
  }

  async createTimeBlock(insertTimeBlock: InsertTimeBlock): Promise<TimeBlock> {
    const result = await db.insert(timeBlocks).values(insertTimeBlock).returning();
    return result[0];
  }

  async updateTimeBlock(id: string, updates: Partial<InsertTimeBlock>): Promise<TimeBlock | undefined> {
    const result = await db.update(timeBlocks).set(updates).where(eq(timeBlocks.id, id)).returning();
    return result[0];
  }

  async deleteTimeBlock(id: string): Promise<boolean> {
    const result = await db.delete(timeBlocks).where(eq(timeBlocks.id, id));
    return result.rowCount > 0;
  }

  async copyTemplateToDate(userId: string, date: string): Promise<TimeBlock[]> {
    const templates = await this.getTimeBlockTemplates();
    const blocksToInsert = templates.map(template => {
      const { id, createdAt, ...templateData } = template;
      return {
        ...templateData,
        userId,
        date,
        isTemplate: false,
        completed: false
      };
    });

    return await db.insert(timeBlocks).values(blocksToInsert).returning();
  }

  // Reminder operations
  async getRemindersForUser(userId: string): Promise<Reminder[]> {
    return await db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const result = await db.insert(reminders).values(insertReminder).returning();
    return result[0];
  }

  async updateReminder(id: string, updates: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const result = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
    return result[0];
  }

  async deleteReminder(id: string): Promise<boolean> {
    const result = await db.delete(reminders).where(eq(reminders.id, id));
    return result.rowCount > 0;
  }

  // Prayer Times operations (Al-Adhan API integration)
  async getPrayerTimesForUserAndDate(userId: string, date: string): Promise<PrayerTimes | undefined> {
    if (!db) return this.memoryFallback.getPrayerTimesForUserAndDate(userId, date);
    try {
      const result = await db.select().from(prayerTimes)
        .where(and(eq(prayerTimes.userId, userId), eq(prayerTimes.date, date)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getPrayerTimesForUserAndDate(userId, date);
    }
  }

  async createPrayerTimes(insertPrayerTimes: InsertPrayerTimes): Promise<PrayerTimes> {
    if (!db) return this.memoryFallback.createPrayerTimes(insertPrayerTimes);
    try {
      const result = await db.insert(prayerTimes).values(insertPrayerTimes).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.createPrayerTimes(insertPrayerTimes);
    }
  }

  async updatePrayerTimes(id: string, updates: Partial<InsertPrayerTimes>): Promise<PrayerTimes | undefined> {
    if (!db) return this.memoryFallback.updatePrayerTimes(id, updates);
    try {
      const result = await db.update(prayerTimes).set(updates).where(eq(prayerTimes.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.updatePrayerTimes(id, updates);
    }
  }
}

export const storage = new DrizzleStorage();
