import { 
  type User, 
  type InsertUser, 
  type Prayer, 
  type InsertPrayer,
  type Adhkar,
  type InsertAdhkar,
  type TimeBlock,
  type InsertTimeBlock,
  type Reminder,
  type InsertReminder
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private prayers: Map<string, Prayer> = new Map();
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
        textAr: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
        textEn: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.",
        transliteration: "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum...",
        category: "morning",
        repetitions: 1,
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
        published: true,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        titleEn: "Evening Protection",
        titleAr: "دعاء المساء",
        textAr: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        textEn: "In the name of Allah with whose name nothing can harm on earth or in heaven, and He is the All-Hearing, All-Knowing",
        category: "evening",
        repetitions: 3,
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
        title: "Tahajjud Prayer & Reflection",
        description: "Night prayer and Quran recitation",
        startTime: "04:30:00",
        duration: 45,
        category: "prayer",
        icon: "moon",
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
        title: "Fajr Prayer",
        description: "Dawn prayer with morning adhkar",
        startTime: "05:23:00",
        duration: 30,
        category: "prayer",
        icon: "sun",
        color: "accent",
        isTemplate: true,
        completed: false,
        date: null,
        tasks: [],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: "template",
        title: "Work/Study Focus",
        description: "Productive work with Islamic intentions",
        startTime: "08:00:00",
        duration: 240,
        category: "work",
        icon: "briefcase",
        color: "muted",
        isTemplate: true,
        completed: false,
        date: null,
        tasks: [
          { id: randomUUID(), title: "Project Review", completed: false },
          { id: randomUUID(), title: "Team Meeting", completed: false }
        ],
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
      },
      {
        id: randomUUID(),
        userId: "template",
        title: "Asr Prayer",
        description: "Afternoon prayer and reflection",
        startTime: "15:45:00",
        duration: 30,
        category: "prayer",
        icon: "sun",
        color: "chart-3",
        isTemplate: true,
        completed: false,
        date: null,
        tasks: [],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: "template",
        title: "Maghrib Prayer",
        description: "Sunset prayer",
        startTime: "19:21:00",
        duration: 30,
        category: "prayer",
        icon: "moon",
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
        title: "Isha Prayer",
        description: "Night prayer",
        startTime: "20:45:00",
        duration: 30,
        category: "prayer",
        icon: "star",
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
      ...insertUser, 
      id, 
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
      ...insertPrayer,
      id,
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

  async createDailyPrayers(userId: string, date: string, prayers: Omit<InsertPrayer, 'userId' | 'date'>[]): Promise<Prayer[]> {
    const createdPrayers: Prayer[] = [];
    
    for (const prayerData of prayers) {
      const prayer = await this.createPrayer({
        ...prayerData,
        userId,
        date
      });
      createdPrayers.push(prayer);
    }
    
    return createdPrayers;
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
    const adhkar: Adhkar = {
      ...insertAdhkar,
      id,
      createdAt: new Date()
    };
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
    const timeBlock: TimeBlock = {
      ...insertTimeBlock,
      id,
      createdAt: new Date()
    };
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
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: new Date()
    };
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

export const storage = new MemStorage();
