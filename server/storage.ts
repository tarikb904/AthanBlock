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
  type Project,
  type InsertProject,
  type Label,
  type InsertLabel,
  type Task,
  type InsertTask,
  type TaskTemplate,
  type InsertTaskTemplate,
  type Collaboration,
  type InsertCollaboration,
  type ActivityFeed,
  type InsertActivityFeed,
  type SavedFilter,
  type InsertSavedFilter,
  type TaskLabel,
  type InsertTaskLabel,
  users,
  prayers,
  prayerTimes,
  adhkar,
  timeBlocks,
  reminders,
  projects,
  labels,
  tasks,
  taskTemplates,
  collaborations,
  activityFeed,
  savedFilters,
  taskLabels
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
  
  // Phase 1 & 2 storage
  private projectsList: Map<string, Project> = new Map();
  private labelsList: Map<string, Label> = new Map();
  private tasksList: Map<string, Task> = new Map();
  private taskTemplatesList: Map<string, TaskTemplate> = new Map();
  private collaborationsList: Map<string, Collaboration> = new Map();
  private activityFeedList: Map<string, ActivityFeed> = new Map();
  private savedFiltersList: Map<string, SavedFilter> = new Map();
  private taskLabelsList: Map<string, TaskLabel> = new Map();

  constructor() {
    this.initializeDefaultData();
    this.initializeIslamicDefaults();
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

  async getUserByToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.authToken === token);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      name: insertUser.name || null,
      email: insertUser.email,
      password: insertUser.password || null,
      location: insertUser.location || null,
      locationLat: insertUser.locationLat || null,
      locationLon: insertUser.locationLon || null,
      timezone: insertUser.timezone || null,
      prayerMethod: insertUser.prayerMethod || null,
      madhab: insertUser.madhab || null,
      language: insertUser.language || null,
      darkMode: insertUser.darkMode || null,
      notifications: insertUser.notifications || null,
      onboardingCompleted: insertUser.onboardingCompleted || false,
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

  // Initialize Islamic defaults for Phase 1 & 2
  private initializeIslamicDefaults() {
    // Default Islamic labels
    const defaultLabels: Label[] = [
      {
        id: randomUUID(),
        userId: 'system',
        name: 'urgent',
        color: '#ef4444',
        isSystemLabel: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'system',
        name: 'fard',
        color: '#dc2626',
        isSystemLabel: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'system',
        name: 'sunnah',
        color: '#2563eb',
        isSystemLabel: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'system',
        name: 'nafl',
        color: '#16a34a',
        isSystemLabel: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'system',
        name: 'adhkar',
        color: '#7c3aed',
        isSystemLabel: true,
        usageCount: 0,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: 'system',
        name: 'dua',
        color: '#4f46e5',
        isSystemLabel: true,
        usageCount: 0,
        createdAt: new Date(),
      },
    ];
    
    defaultLabels.forEach(label => this.labelsList.set(label.id, label));

    // Default Islamic task templates
    const defaultTemplates: TaskTemplate[] = [
      {
        id: randomUUID(),
        createdBy: 'system',
        name: 'Morning Islamic Routine',
        description: 'Comprehensive morning Islamic practices',
        category: 'morning_routine',
        islamicCategory: 'sunnah',
        tasks: [
          {
            title: 'Fajr Prayer',
            islamicPriority: 1,
            prayerRelated: true,
            beforePrayer: '',
            afterPrayer: '',
            estimatedMinutes: 10
          },
          {
            title: 'Morning Adhkar',
            islamicPriority: 3,
            estimatedMinutes: 15
          },
          {
            title: 'Quran Reading',
            islamicPriority: 3,
            estimatedMinutes: 20
          }
        ],
        isPublic: true,
        isSystemTemplate: true,
        usageCount: 0,
        rating: 5,
        tags: ['morning', 'daily', 'routine'],
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        createdBy: 'system',
        name: 'Evening Islamic Routine',
        description: 'Essential evening Islamic practices',
        category: 'evening_routine',
        islamicCategory: 'sunnah',
        tasks: [
          {
            title: 'Maghrib Prayer',
            islamicPriority: 1,
            prayerRelated: true,
            estimatedMinutes: 10
          },
          {
            title: 'Evening Adhkar',
            islamicPriority: 3,
            estimatedMinutes: 10
          },
          {
            title: 'Isha Prayer',
            islamicPriority: 1,
            prayerRelated: true,
            estimatedMinutes: 10
          }
        ],
        isPublic: true,
        isSystemTemplate: true,
        usageCount: 0,
        rating: 5,
        tags: ['evening', 'daily', 'routine'],
        createdAt: new Date(),
      }
    ];

    defaultTemplates.forEach(template => this.taskTemplatesList.set(template.id, template));
  }

  // Project operations
  async getProjectsForUser(userId: string): Promise<Project[]> {
    return Array.from(this.projectsList.values()).filter(
      project => project.userId === userId && !project.isArchived
    );
  }

  async getProjectHierarchy(userId: string): Promise<Project[]> {
    const userProjects = await this.getProjectsForUser(userId);
    return userProjects.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { ...insertProject, id, createdAt: new Date() };
    this.projectsList.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projectsList.get(id);
    if (!project) return undefined;
    const updatedProject = { ...project, ...updates };
    this.projectsList.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projectsList.delete(id);
  }

  // Label operations
  async getLabelsForUser(userId: string): Promise<Label[]> {
    return Array.from(this.labelsList.values()).filter(
      label => label.userId === userId || label.isSystemLabel
    );
  }

  async createLabel(insertLabel: InsertLabel): Promise<Label> {
    const id = randomUUID();
    const label: Label = { ...insertLabel, id, createdAt: new Date(), usageCount: 0 };
    this.labelsList.set(id, label);
    return label;
  }

  async updateLabel(id: string, updates: Partial<InsertLabel>): Promise<Label | undefined> {
    const label = this.labelsList.get(id);
    if (!label) return undefined;
    const updatedLabel = { ...label, ...updates };
    this.labelsList.set(id, updatedLabel);
    return updatedLabel;
  }

  async deleteLabel(id: string): Promise<boolean> {
    return this.labelsList.delete(id);
  }

  // Advanced Task operations
  async getTasksForUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasksList.values()).filter(
      task => task.userId === userId || task.assignedToUserId === userId
    );
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return Array.from(this.tasksList.values()).filter(
      task => task.projectId === projectId
    );
  }

  async getTasksByStatus(userId: string, status: string): Promise<Task[]> {
    return Array.from(this.tasksList.values()).filter(
      task => (task.userId === userId || task.assignedToUserId === userId) && task.status === status
    );
  }

  async getTasksByIslamicPriority(userId: string, priority: number): Promise<Task[]> {
    return Array.from(this.tasksList.values()).filter(
      task => (task.userId === userId || task.assignedToUserId === userId) && task.islamicPriority === priority
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasksList.set(id, task);
    
    // Create activity feed entry
    await this.createActivityFeed({
      userId: task.userId,
      actorId: task.userId,
      action: 'task_created',
      entityType: 'task',
      entityId: id,
      metadata: { taskTitle: task.title }
    });

    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasksList.get(id);
    if (!task) return undefined;
    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.tasksList.set(id, updatedTask);

    // Create activity feed entry
    await this.createActivityFeed({
      userId: task.userId,
      actorId: task.userId,
      action: 'task_updated',
      entityType: 'task',
      entityId: id,
      metadata: { changes: updates }
    });

    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = this.tasksList.get(id);
    if (task) {
      await this.createActivityFeed({
        userId: task.userId,
        actorId: task.userId,
        action: 'task_deleted',
        entityType: 'task',
        entityId: id,
        metadata: { taskTitle: task.title }
      });
    }
    return this.tasksList.delete(id);
  }

  // Task Template operations
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplatesList.values()).filter(template => template.isPublic || template.isSystemTemplate);
  }

  async getTaskTemplatesForUser(userId: string): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplatesList.values()).filter(
      template => template.createdBy === userId || template.isPublic || template.isSystemTemplate
    );
  }

  async createTaskTemplate(insertTemplate: InsertTaskTemplate): Promise<TaskTemplate> {
    const id = randomUUID();
    const template: TaskTemplate = { 
      ...insertTemplate, 
      id, 
      createdAt: new Date(),
      usageCount: 0,
      rating: 0
    };
    this.taskTemplatesList.set(id, template);
    return template;
  }

  async updateTaskTemplate(id: string, updates: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    const template = this.taskTemplatesList.get(id);
    if (!template) return undefined;
    const updatedTemplate = { ...template, ...updates };
    this.taskTemplatesList.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    return this.taskTemplatesList.delete(id);
  }

  // Collaboration operations
  async getCollaborationsForUser(userId: string): Promise<Collaboration[]> {
    return Array.from(this.collaborationsList.values()).filter(
      collab => collab.ownerId === userId || collab.collaboratorId === userId
    );
  }

  async createCollaboration(insertCollaboration: InsertCollaboration): Promise<Collaboration> {
    const id = randomUUID();
    const collaboration: Collaboration = { 
      ...insertCollaboration, 
      id, 
      invitedAt: new Date()
    };
    this.collaborationsList.set(id, collaboration);
    return collaboration;
  }

  async updateCollaboration(id: string, updates: Partial<InsertCollaboration>): Promise<Collaboration | undefined> {
    const collaboration = this.collaborationsList.get(id);
    if (!collaboration) return undefined;
    const updatedCollaboration = { ...collaboration, ...updates };
    if (updates.status === 'accepted' && !collaboration.acceptedAt) {
      updatedCollaboration.acceptedAt = new Date();
    }
    this.collaborationsList.set(id, updatedCollaboration);
    return updatedCollaboration;
  }

  // Activity Feed operations
  async getActivityFeedForUser(userId: string): Promise<ActivityFeed[]> {
    return Array.from(this.activityFeedList.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50); // Latest 50 activities
  }

  async createActivityFeed(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    const id = randomUUID();
    const activity: ActivityFeed = { ...insertActivity, id, createdAt: new Date() };
    this.activityFeedList.set(id, activity);
    return activity;
  }

  // Saved Filters operations
  async getSavedFiltersForUser(userId: string): Promise<SavedFilter[]> {
    return Array.from(this.savedFiltersList.values())
      .filter(filter => filter.userId === userId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async createSavedFilter(insertFilter: InsertSavedFilter): Promise<SavedFilter> {
    const id = randomUUID();
    const filter: SavedFilter = { ...insertFilter, id, createdAt: new Date() };
    this.savedFiltersList.set(id, filter);
    return filter;
  }

  async updateSavedFilter(id: string, updates: Partial<InsertSavedFilter>): Promise<SavedFilter | undefined> {
    const filter = this.savedFiltersList.get(id);
    if (!filter) return undefined;
    const updatedFilter = { ...filter, ...updates };
    this.savedFiltersList.set(id, updatedFilter);
    return updatedFilter;
  }

  async deleteSavedFilter(id: string): Promise<boolean> {
    return this.savedFiltersList.delete(id);
  }
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
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

  // Phase 1 & 2: Advanced Islamic Task Management Operations

  // Project operations
  getProjectsForUser(userId: string): Promise<Project[]>;
  getProjectHierarchy(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Label operations
  getLabelsForUser(userId: string): Promise<Label[]>;
  createLabel(label: InsertLabel): Promise<Label>;
  updateLabel(id: string, updates: Partial<InsertLabel>): Promise<Label | undefined>;
  deleteLabel(id: string): Promise<boolean>;

  // Advanced Task operations
  getTasksForUser(userId: string): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTasksByStatus(userId: string, status: string): Promise<Task[]>;
  getTasksByIslamicPriority(userId: string, priority: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Task Template operations
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplatesForUser(userId: string): Promise<TaskTemplate[]>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, updates: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined>;
  deleteTaskTemplate(id: string): Promise<boolean>;

  // Collaboration operations
  getCollaborationsForUser(userId: string): Promise<Collaboration[]>;
  createCollaboration(collaboration: InsertCollaboration): Promise<Collaboration>;
  updateCollaboration(id: string, updates: Partial<InsertCollaboration>): Promise<Collaboration | undefined>;

  // Activity Feed operations
  getActivityFeedForUser(userId: string): Promise<ActivityFeed[]>;
  createActivityFeed(activity: InsertActivityFeed): Promise<ActivityFeed>;

  // Saved Filters operations
  getSavedFiltersForUser(userId: string): Promise<SavedFilter[]>;
  createSavedFilter(filter: InsertSavedFilter): Promise<SavedFilter>;
  updateSavedFilter(id: string, updates: Partial<InsertSavedFilter>): Promise<SavedFilter | undefined>;
  deleteSavedFilter(id: string): Promise<boolean>;
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

  async getUserByToken(token: string): Promise<User | undefined> {
    if (!db) return this.memoryFallback.getUserByToken(token);
    try {
      const result = await db.select().from(users).where(eq(users.authToken, token)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Database error, falling back to memory:', error);
      return this.memoryFallback.getUserByToken(token);
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

  // ====================================================
  // Phase 1 & 2: Advanced Islamic Task Management Methods
  // ====================================================
  
  // Project operations - delegate to memory fallback for now
  async getProjectsForUser(userId: string): Promise<Project[]> {
    return this.memoryFallback.getProjectsForUser(userId);
  }

  async getProjectHierarchy(userId: string): Promise<Project[]> {
    return this.memoryFallback.getProjectHierarchy(userId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    return this.memoryFallback.createProject(insertProject);
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    return this.memoryFallback.updateProject(id, updates);
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.memoryFallback.deleteProject(id);
  }

  // Label operations
  async getLabelsForUser(userId: string): Promise<Label[]> {
    return this.memoryFallback.getLabelsForUser(userId);
  }

  async createLabel(insertLabel: InsertLabel): Promise<Label> {
    return this.memoryFallback.createLabel(insertLabel);
  }

  async updateLabel(id: string, updates: Partial<InsertLabel>): Promise<Label | undefined> {
    return this.memoryFallback.updateLabel(id, updates);
  }

  async deleteLabel(id: string): Promise<boolean> {
    return this.memoryFallback.deleteLabel(id);
  }

  // Advanced Task operations
  async getTasksForUser(userId: string): Promise<Task[]> {
    return this.memoryFallback.getTasksForUser(userId);
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.memoryFallback.getTasksByProject(projectId);
  }

  async getTasksByStatus(userId: string, status: string): Promise<Task[]> {
    return this.memoryFallback.getTasksByStatus(userId, status);
  }

  async getTasksByIslamicPriority(userId: string, priority: number): Promise<Task[]> {
    return this.memoryFallback.getTasksByIslamicPriority(userId, priority);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    return this.memoryFallback.createTask(insertTask);
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    return this.memoryFallback.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.memoryFallback.deleteTask(id);
  }

  // Task Template operations
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return this.memoryFallback.getTaskTemplates();
  }

  async getTaskTemplatesForUser(userId: string): Promise<TaskTemplate[]> {
    return this.memoryFallback.getTaskTemplatesForUser(userId);
  }

  async createTaskTemplate(insertTemplate: InsertTaskTemplate): Promise<TaskTemplate> {
    return this.memoryFallback.createTaskTemplate(insertTemplate);
  }

  async updateTaskTemplate(id: string, updates: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    return this.memoryFallback.updateTaskTemplate(id, updates);
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    return this.memoryFallback.deleteTaskTemplate(id);
  }

  // Collaboration operations
  async getCollaborationsForUser(userId: string): Promise<Collaboration[]> {
    return this.memoryFallback.getCollaborationsForUser(userId);
  }

  async createCollaboration(insertCollaboration: InsertCollaboration): Promise<Collaboration> {
    return this.memoryFallback.createCollaboration(insertCollaboration);
  }

  async updateCollaboration(id: string, updates: Partial<InsertCollaboration>): Promise<Collaboration | undefined> {
    return this.memoryFallback.updateCollaboration(id, updates);
  }

  // Activity Feed operations
  async getActivityFeedForUser(userId: string): Promise<ActivityFeed[]> {
    return this.memoryFallback.getActivityFeedForUser(userId);
  }

  async createActivityFeed(insertActivity: InsertActivityFeed): Promise<ActivityFeed> {
    return this.memoryFallback.createActivityFeed(insertActivity);
  }

  // Saved Filters operations
  async getSavedFiltersForUser(userId: string): Promise<SavedFilter[]> {
    return this.memoryFallback.getSavedFiltersForUser(userId);
  }

  async createSavedFilter(insertFilter: InsertSavedFilter): Promise<SavedFilter> {
    return this.memoryFallback.createSavedFilter(insertFilter);
  }

  async updateSavedFilter(id: string, updates: Partial<InsertSavedFilter>): Promise<SavedFilter | undefined> {
    return this.memoryFallback.updateSavedFilter(id, updates);
  }

  async deleteSavedFilter(id: string): Promise<boolean> {
    return this.memoryFallback.deleteSavedFilter(id);
  }
}

export const storage = new DrizzleStorage();
