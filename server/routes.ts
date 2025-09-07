import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertAdhkarSchema, 
  insertTimeBlockSchema, 
  insertReminderSchema,
  insertPrayerTimesSchema 
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

// Authentication middleware to get current user from session  
function getCurrentUser(req: any) {
  // Return actual user ID from session, or null if not logged in
  if (!req.session) {
    console.log('No session found');
    return null;
  }
  
  const userId = req.session.userId;
  if (!userId) {
    console.log('No userId in session:', req.session.id);
    return null;
  }
  
  console.log('Found userId in session:', userId);
  return userId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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

      const user = await storage.createUser(validatedData);
      // Regenerate session for new user
      (req as any).session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session regeneration failed" });
        }
        
        // Set user session
        (req as any).session.userId = user.id;
        
        console.log('Setting registration session userId to:', user.id);
        console.log('Registration session before save:', (req as any).session);
        
        // Save session explicitly
        (req as any).session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          console.log('Registration session saved for user:', user.id);
          console.log('Registration session after save:', (req as any).session);
          res.json({ user: { id: user.id, email: user.email, name: user.name } });
        });
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
      console.log("Login request body:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      console.log("Found user:", user ? "Yes" : "No");
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Regenerate session to prevent fixation attacks and ensure clean state
      (req as any).session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session regeneration failed" });
        }
        
        // Set user session
        (req as any).session.userId = user.id;
        
        console.log('Setting session userId to:', user.id);
        console.log('Session before save:', (req as any).session);
        
        // Save session explicitly
        (req as any).session.save((saveErr: any) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          console.log("Login successful for user:", user.id);
          console.log('Session after save:', (req as any).session);
          res.json({ user: { id: user.id, email: user.email, name: user.name } });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
      const { date } = req.params;
      const timeBlocks = await storage.copyTemplateToDate(userId, date);
      res.json(timeBlocks);
    } catch (error) {
      res.status(400).json({ message: "Failed to copy template" });
    }
  });

  app.post("/api/time-blocks", async (req, res) => {
    try {
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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
      const userId = getCurrentUser(req);
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

  const httpServer = createServer(app);
  return httpServer;
}
