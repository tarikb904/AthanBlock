import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertAdhkarSchema, 
  insertTimeBlockSchema, 
  insertReminderSchema,
  insertPrayerTimesSchema,
  insertProjectSchema,
  insertLabelSchema,
  insertTaskSchema,
  insertTaskTemplateSchema,
  insertCollaborationSchema,
  insertActivityFeedSchema,
  insertSavedFilterSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  fetchPrayerTimes, 
  fetchPrayerTimesRange, 
  validateCoordinates, 
  validatePrayerMethod, 
  validateMadhab,
  PRAYER_METHODS,
  MADHAB_SCHOOLS 
} from "./services/aladhan";
import { generateComprehensivePrayerSchedule, type ComprehensivePrayer } from "./services/comprehensive-prayers";

// Authentication middleware to get current user from token
async function getCurrentUser(req: any) {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Find user by token
  try {
    const user = await storage.getUserByToken(token);
    if (!user) {
      return null;
    }
    return user.id;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Test endpoint to check cookie functionality
  app.get("/api/test/cookie", (req, res) => {
    console.log("=== COOKIE TEST ===");
    console.log("Request cookies:", req.headers.cookie);
    console.log("===================");
    
    // Manually set a test cookie
    res.cookie('test-cookie', 'test-value-123', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600000,
      path: '/'
    });
    
    res.json({
      message: 'Test cookie set',
      cookiesReceived: req.headers.cookie || 'none',
      timestamp: new Date().toISOString()
    });
  });
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Registration request body:", req.body);
      
      // Basic validation for required fields
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const userData = {
        email,
        password,
        name: name || "User", // Provide default name if not provided
      };

      console.log("Validating user data:", userData);
      const validatedData = insertUserSchema.parse(userData);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate authentication token
      const authToken = `${Buffer.from(email).toString('base64')}.${Date.now()}.${Math.random().toString(36).substring(7)}`;
      
      const user = await storage.createUser({
        ...validatedData,
        authToken
      });
      
      console.log('Registration successful for user:', user.id);
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          onboardingCompleted: user.onboardingCompleted 
        },
        token: authToken
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: "Invalid user data", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Security: Don't log sensitive data like passwords
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log("Found user:", user ? "Yes" : "No");
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate new authentication token
      const authToken = `${Buffer.from(email).toString('base64')}.${Date.now()}.${Math.random().toString(36).substring(7)}`;
      
      // Update user with new token
      const updatedUser = await storage.updateUser(user.id, { authToken });
      
      console.log("Login successful for user:", user.id);
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          onboardingCompleted: user.onboardingCompleted 
        },
        token: authToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/profile", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/user/profile", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updates = req.body;
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Prayer routes
  app.get("/api/prayers", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { date } = req.query;
      const prayers = await storage.getPrayersForUserAndDate(userId, date as string);
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prayers" });
    }
  });

  app.post("/api/prayers/:date/generate", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { date } = req.params;
      const { prayerTimes } = req.body; // Array of prayer time objects
      
      // Ensure prayer times have the correct field names
      const normalizedPrayerTimes = prayerTimes.map((prayer: any) => ({
        name: prayer.name || prayer.prayerName,
        time: prayer.time || prayer.prayerTime,
        completed: prayer.completed || false
      }));
      
      const prayers = await storage.createDailyPrayers(userId, date, normalizedPrayerTimes);
      res.json(prayers);
    } catch (error) {
      console.error("Prayer generation error:", error);
      res.status(400).json({ message: "Failed to generate prayers" });
    }
  });

  // Generate comprehensive prayer schedule (includes sunnah, nafl, witr)
  app.post("/api/prayers/:date/comprehensive", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { date } = req.params;
      const { lat, lon, method, madhab } = req.body;

      if (!validateCoordinates(lat, lon) || !validatePrayerMethod(method) || !validateMadhab(madhab)) {
        return res.status(400).json({ message: "Invalid parameters" });
      }

      // Fetch basic prayer times from Al-Adhan API
      const basicPrayerTimes = await fetchPrayerTimes(lat, lon, method, madhab, date);
      
      // Generate comprehensive prayer schedule
      const comprehensiveSchedule = generateComprehensivePrayerSchedule(date, basicPrayerTimes);
      
      // Store each prayer with additional metadata
      const prayers = [];
      for (const prayer of comprehensiveSchedule.prayers) {
        const createdPrayer = await storage.createPrayer({
          userId,
          name: prayer.name,
          time: prayer.time,
          completed: false,
          date,
        });
        prayers.push({
          ...createdPrayer,
          displayName: prayer.displayName,
          type: prayer.type,
          category: prayer.category,
          rakats: prayer.rakats,
          description: prayer.description,
          isOptional: prayer.isOptional,
          priority: prayer.priority
        });
      }

      res.json({ 
        message: "Comprehensive prayers generated successfully", 
        prayers,
        prayerTimes: basicPrayerTimes,
        totalPrayers: prayers.length,
        fardCount: prayers.filter(p => p.type === 'fard').length,
        sunnahCount: prayers.filter(p => p.type === 'sunnah').length,
        naflCount: prayers.filter(p => p.type === 'nafl').length
      });
    } catch (error) {
      console.error("Failed to generate comprehensive prayers:", error);
      res.status(500).json({ message: "Failed to generate comprehensive prayers" });
    }
  });

  app.patch("/api/prayers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const prayer = await storage.updatePrayer(id, updates);
      if (!prayer) {
        return res.status(404).json({ message: "Prayer not found" });
      }
      res.json(prayer);
    } catch (error) {
      res.status(400).json({ message: "Failed to update prayer" });
    }
  });

  // Adhkar routes
  app.get("/api/adhkar", async (req, res) => {
    try {
      const { category } = req.query;
      const adhkar = category 
        ? await storage.getAdhkarByCategory(category as string)
        : await storage.getAllAdhkar();
      res.json(adhkar);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch adhkar" });
    }
  });

  app.post("/api/adhkar", async (req, res) => {
    try {
      const adhkarData = insertAdhkarSchema.parse(req.body);
      const adhkar = await storage.createAdhkar(adhkarData);
      res.json(adhkar);
    } catch (error) {
      res.status(400).json({ message: "Invalid adhkar data" });
    }
  });

  app.patch("/api/adhkar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const adhkar = await storage.updateAdhkar(id, updates);
      if (!adhkar) {
        return res.status(404).json({ message: "Adhkar not found" });
      }
      res.json(adhkar);
    } catch (error) {
      res.status(400).json({ message: "Failed to update adhkar" });
    }
  });

  app.delete("/api/adhkar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAdhkar(id);
      if (!deleted) {
        return res.status(404).json({ message: "Adhkar not found" });
      }
      res.json({ message: "Adhkar deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete adhkar" });
    }
  });

  // Time block routes
  app.get("/api/time-blocks/:date", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      const { date } = req.params;
      const timeBlocks = await storage.getTimeBlocksForUserAndDate(userId, date);
      res.json(timeBlocks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time blocks" });
    }
  });

  app.get("/api/time-blocks/templates", async (req, res) => {
    try {
      const templates = await storage.getTimeBlockTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/time-blocks/:date/copy-template", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      const { date } = req.params;
      const timeBlocks = await storage.copyTemplateToDate(userId, date);
      res.json(timeBlocks);
    } catch (error) {
      res.status(400).json({ message: "Failed to copy template" });
    }
  });

  app.post("/api/time-blocks", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      const timeBlockData = insertTimeBlockSchema.parse({
        ...req.body,
        userId
      });
      const timeBlock = await storage.createTimeBlock(timeBlockData);
      res.json(timeBlock);
    } catch (error) {
      res.status(400).json({ message: "Invalid time block data" });
    }
  });

  app.patch("/api/time-blocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const timeBlock = await storage.updateTimeBlock(id, updates);
      if (!timeBlock) {
        return res.status(404).json({ message: "Time block not found" });
      }
      res.json(timeBlock);
    } catch (error) {
      res.status(400).json({ message: "Failed to update time block" });
    }
  });

  // Reminder routes
  app.get("/api/reminders", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const reminders = await storage.getRemindersForUser(userId);
      res.json(reminders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      const reminderData = insertReminderSchema.parse({
        ...req.body,
        userId
      });
      const reminder = await storage.createReminder(reminderData);
      res.json(reminder);
    } catch (error) {
      res.status(400).json({ message: "Invalid reminder data" });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const reminder = await storage.updateReminder(id, updates);
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      res.status(400).json({ message: "Failed to update reminder" });
    }
  });

  // Al-Adhan Prayer Times API Integration Routes
  
  // Fetch prayer times from Al-Adhan API and store them
  app.post("/api/prayers/fetch", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      const { lat, lon, method, madhab, start_date, days = 7 } = req.body;
      
      // Validate input
      if (!lat || !lon || method === undefined || madhab === undefined || !start_date) {
        return res.status(400).json({ 
          message: "Missing required fields: lat, lon, method, madhab, start_date" 
        });
      }
      
      if (!validateCoordinates(lat, lon)) {
        return res.status(400).json({ 
          message: "Invalid coordinates. Latitude must be -90 to 90, longitude must be -180 to 180" 
        });
      }
      
      if (!validatePrayerMethod(method)) {
        return res.status(400).json({ 
          message: "Invalid prayer method. See API documentation for valid methods" 
        });
      }
      
      if (!validateMadhab(madhab)) {
        return res.status(400).json({ 
          message: "Invalid madhab. Use 0 for Shafi/Maliki/Hanbali or 1 for Hanafi" 
        });
      }
      
      // Fetch prayer times from Al-Adhan API
      const prayerTimesData = await fetchPrayerTimesRange(lat, lon, method, madhab, start_date, days);
      
      // Store in database (with caching logic)
      const storedPrayerTimes = [];
      for (const prayerTime of prayerTimesData) {
        // Check if already exists for this user/date
        const existing = await storage.getPrayerTimesForUserAndDate?.(userId, prayerTime.date);
        
        if (existing) {
          // Update existing record
          const updated = await storage.updatePrayerTimes?.(existing.id, {
            fajr: prayerTime.fajr,
            sunrise: prayerTime.sunrise,
            dhuhr: prayerTime.dhuhr,
            asr: prayerTime.asr,
            maghrib: prayerTime.maghrib,
            isha: prayerTime.isha,
            prayerMethod: prayerTime.method,
            madhab: prayerTime.madhab,
            locationLat: prayerTime.locationLat,
            locationLon: prayerTime.locationLon,
          });
          storedPrayerTimes.push(updated);
        } else {
          // Create new record
          const created = await storage.createPrayerTimes?.({
            userId,
            date: prayerTime.date,
            fajr: prayerTime.fajr,
            sunrise: prayerTime.sunrise,
            dhuhr: prayerTime.dhuhr,
            asr: prayerTime.asr,
            maghrib: prayerTime.maghrib,
            isha: prayerTime.isha,
            source: prayerTime.source,
            prayerMethod: prayerTime.method,
            madhab: prayerTime.madhab,
            locationLat: prayerTime.locationLat,
            locationLon: prayerTime.locationLon,
          });
          storedPrayerTimes.push(created);
        }
      }
      
      res.json({
        message: `Successfully fetched and stored prayer times for ${days} days`,
        count: storedPrayerTimes.length,
        prayerTimes: storedPrayerTimes
      });
      
    } catch (error) {
      console.error('Prayer times fetch error:', error);
      res.status(500).json({ 
        message: "Failed to fetch prayer times",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get cached prayer times for user and date range
  app.get("/api/prayer-times/:userId/:startDate/:endDate?", async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.params;
      const currentUserId = getCurrentUser(req);
      
      // Only allow users to access their own prayer times
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For now, get single date (endDate support can be added later)
      const prayerTimes = await storage.getPrayerTimesForUserAndDate?.(userId, startDate);
      
      if (!prayerTimes) {
        return res.status(404).json({ 
          message: "Prayer times not found for this date. Use /api/prayers/fetch to get them from Al-Adhan API" 
        });
      }
      
      res.json(prayerTimes);
      
    } catch (error) {
      console.error('Get prayer times error:', error);
      res.status(500).json({ message: "Failed to get prayer times" });
    }
  });

  // Get prayer times for current user by date (unified endpoint with auto-fetch)
  app.get("/api/prayer-times/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const userId = await getCurrentUser(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }
      
      // Check if prayer times are cached
      let prayerTimes = await storage.getPrayerTimesForUserAndDate?.(userId, date);
      
      if (!prayerTimes) {
        // Fetch user location and settings
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Use default values if user location not set
        const lat = parseFloat(user.locationLat || "40.7128"); // Default to NYC
        const lon = parseFloat(user.locationLon || "-74.0060");
        const method = user.prayerMethod || 2; // ISNA default
        const madhab = user.madhab || 1; // Hanafi default

        try {
          // Fetch from Al-Adhan API
          const aladhanPrayerTimes = await fetchPrayerTimes(lat, lon, method, madhab, date);
          
          // Cache the prayer times
          const insertData = {
            userId: userId,
            date: date,
            fajr: aladhanPrayerTimes.fajr,
            sunrise: aladhanPrayerTimes.sunrise,
            dhuhr: aladhanPrayerTimes.dhuhr,
            asr: aladhanPrayerTimes.asr,
            maghrib: aladhanPrayerTimes.maghrib,
            isha: aladhanPrayerTimes.isha,
            source: aladhanPrayerTimes.source,
            prayerMethod: aladhanPrayerTimes.method,
            madhab: aladhanPrayerTimes.madhab,
            locationLat: aladhanPrayerTimes.locationLat,
            locationLon: aladhanPrayerTimes.locationLon,
          };
          
          prayerTimes = await storage.createPrayerTimes(insertData);
        } catch (fetchError) {
          console.error('Failed to fetch prayer times from Al-Adhan:', fetchError);
          
          // Return fallback prayer times instead of 404
          const fallbackTimes = {
            fajr: "05:30",
            sunrise: "06:45", 
            dhuhr: "12:15",
            asr: "15:30",
            maghrib: "18:45",
            isha: "20:00",
            date: date,
            source: "fallback"
          };
          
          return res.json(fallbackTimes);
        }
      }
      
      // Return consistent response format
      const response = {
        fajr: prayerTimes.fajr,
        sunrise: prayerTimes.sunrise,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
        date: prayerTimes.date,
        source: prayerTimes.source,
        method: prayerTimes.prayerMethod,
        madhab: prayerTimes.madhab,
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Get prayer times by date error:', error);
      res.status(500).json({ message: "Failed to get prayer times" });
    }
  });
  
  // Get prayer calculation methods and madhabs
  app.get("/api/prayer-settings/options", async (req, res) => {
    try {
      res.json({
        methods: Object.entries(PRAYER_METHODS).map(([name, id]) => ({
          id,
          name: name.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
          value: id
        })),
        madhabs: Object.entries(MADHAB_SCHOOLS).map(([name, id]) => ({
          id,
          name: name.toLowerCase().replace(/^\w/, c => c.toUpperCase()),
          value: id
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get prayer settings options" });
    }
  });

  // ===============================================
  // PHASE 1 & 2: Advanced Islamic Task Management
  // ===============================================

  // Projects API - Islamic Project Hierarchy
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const projects = await storage.getProjectHierarchy(userId);
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updatedProject = await storage.updateProject(req.params.id, req.body);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(updatedProject);
    } catch (error) {
      console.error("Update project error:", error);
      res.status(400).json({ message: "Invalid project update data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteProject(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete project error:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Smart Labels API
  app.get("/api/labels", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const labels = await storage.getLabelsForUser(userId);
      res.json(labels);
    } catch (error) {
      console.error("Get labels error:", error);
      res.status(500).json({ message: "Failed to get labels" });
    }
  });

  app.post("/api/labels", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertLabelSchema.parse({ ...req.body, userId });
      const label = await storage.createLabel(validatedData);
      res.json(label);
    } catch (error) {
      console.error("Create label error:", error);
      res.status(400).json({ message: "Invalid label data" });
    }
  });

  app.put("/api/labels/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updatedLabel = await storage.updateLabel(req.params.id, req.body);
      if (!updatedLabel) {
        return res.status(404).json({ message: "Label not found" });
      }
      res.json(updatedLabel);
    } catch (error) {
      console.error("Update label error:", error);
      res.status(400).json({ message: "Invalid label update data" });
    }
  });

  app.delete("/api/labels/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteLabel(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete label error:", error);
      res.status(500).json({ message: "Failed to delete label" });
    }
  });

  // Advanced Tasks API with Islamic Features
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { projectId, status, islamicPriority } = req.query;

      let tasks;
      if (projectId && typeof projectId === 'string') {
        tasks = await storage.getTasksByProject(projectId);
      } else if (status && typeof status === 'string') {
        tasks = await storage.getTasksByStatus(userId, status);
      } else if (islamicPriority && typeof islamicPriority === 'string') {
        tasks = await storage.getTasksByIslamicPriority(userId, parseInt(islamicPriority));
      } else {
        tasks = await storage.getTasksForUser(userId);
      }

      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updatedTask = await storage.updateTask(req.params.id, req.body);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(400).json({ message: "Invalid task update data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteTask(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task Templates API - Islamic Routines
  app.get("/api/templates", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const templates = await storage.getTaskTemplatesForUser(userId);
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  app.get("/api/templates/public", async (req, res) => {
    try {
      const templates = await storage.getTaskTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get public templates error:", error);
      res.status(500).json({ message: "Failed to get public templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertTaskTemplateSchema.parse({ ...req.body, createdBy: userId });
      const template = await storage.createTaskTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updatedTemplate = await storage.updateTaskTemplate(req.params.id, req.body);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(400).json({ message: "Invalid template update data" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteTaskTemplate(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Collaboration API - Family & Team Sharing
  app.get("/api/collaborations", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const collaborations = await storage.getCollaborationsForUser(userId);
      res.json(collaborations);
    } catch (error) {
      console.error("Get collaborations error:", error);
      res.status(500).json({ message: "Failed to get collaborations" });
    }
  });

  app.post("/api/collaborations", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertCollaborationSchema.parse({ ...req.body, ownerId: userId });
      const collaboration = await storage.createCollaboration(validatedData);
      res.json(collaboration);
    } catch (error) {
      console.error("Create collaboration error:", error);
      res.status(400).json({ message: "Invalid collaboration data" });
    }
  });

  app.put("/api/collaborations/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updatedCollaboration = await storage.updateCollaboration(req.params.id, req.body);
      if (!updatedCollaboration) {
        return res.status(404).json({ message: "Collaboration not found" });
      }
      res.json(updatedCollaboration);
    } catch (error) {
      console.error("Update collaboration error:", error);
      res.status(400).json({ message: "Invalid collaboration update data" });
    }
  });

  // Activity Feed API
  app.get("/api/activity", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const activities = await storage.getActivityFeedForUser(userId);
      res.json(activities);
    } catch (error) {
      console.error("Get activity error:", error);
      res.status(500).json({ message: "Failed to get activity feed" });
    }
  });

  // Saved Filters API - Custom Views
  app.get("/api/filters", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const filters = await storage.getSavedFiltersForUser(userId);
      res.json(filters);
    } catch (error) {
      console.error("Get filters error:", error);
      res.status(500).json({ message: "Failed to get saved filters" });
    }
  });

  app.post("/api/filters", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertSavedFilterSchema.parse({ ...req.body, userId });
      const filter = await storage.createSavedFilter(validatedData);
      res.json(filter);
    } catch (error) {
      console.error("Create filter error:", error);
      res.status(400).json({ message: "Invalid filter data" });
    }
  });

  app.put("/api/filters/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updatedFilter = await storage.updateSavedFilter(req.params.id, req.body);
      if (!updatedFilter) {
        return res.status(404).json({ message: "Filter not found" });
      }
      res.json(updatedFilter);
    } catch (error) {
      console.error("Update filter error:", error);
      res.status(400).json({ message: "Invalid filter update data" });
    }
  });

  app.delete("/api/filters/:id", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const success = await storage.deleteSavedFilter(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Delete filter error:", error);
      res.status(500).json({ message: "Failed to delete filter" });
    }
  });

  // Islamic Context API - Get all Islamic data
  app.get("/api/islamic/context", async (req, res) => {
    try {
      const userId = await getCurrentUser(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Return comprehensive Islamic data for the frontend
      const [projects, labels, templates, tasks] = await Promise.all([
        storage.getProjectHierarchy(userId),
        storage.getLabelsForUser(userId),
        storage.getTaskTemplatesForUser(userId),
        storage.getTasksForUser(userId)
      ]);

      const islamicContext = {
        projects: projects.filter(p => p.category === 'ibadah'),
        dunyaProjects: projects.filter(p => p.category === 'dunya'),
        familyProjects: projects.filter(p => p.category === 'family'),
        workProjects: projects.filter(p => p.category === 'work'),
        learningProjects: projects.filter(p => p.category === 'learning'),
        islamicLabels: labels.filter(l => ['fard', 'sunnah', 'nafl', 'adhkar', 'dua'].includes(l.name)),
        systemLabels: labels.filter(l => l.isSystemLabel),
        userLabels: labels.filter(l => !l.isSystemLabel),
        templates: templates,
        fardTasks: tasks.filter(t => t.islamicPriority === 1),
        sunnahTasks: tasks.filter(t => t.islamicPriority === 3),
        naflTasks: tasks.filter(t => t.islamicPriority === 4),
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length
      };

      res.json(islamicContext);
    } catch (error) {
      console.error("Get Islamic context error:", error);
      res.status(500).json({ message: "Failed to get Islamic context" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
