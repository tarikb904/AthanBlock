import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertAdhkarSchema, insertTimeBlockSchema, insertReminderSchema } from "@shared/schema";
import { z } from "zod";

// Authentication middleware to get current user from session
function getCurrentUser(req: any) {
  // For demo purposes, use session user ID or fallback to demo user
  return req.session?.userId || "demo-user";
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      // Set user session
      (req as any).session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      (req as any).session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(400).json({ message: "Login failed" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const userId = getCurrentUser(req);
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
  app.get("/api/prayers/:date", async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      const { date } = req.params;
      const prayers = await storage.getPrayersForUserAndDate(userId, date);
      res.json(prayers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prayers" });
    }
  });

  app.post("/api/prayers/:date/generate", async (req, res) => {
    try {
      const userId = getCurrentUser(req);
      const { date } = req.params;
      const { prayerTimes } = req.body; // Array of prayer time objects
      
      const prayers = await storage.createDailyPrayers(userId, date, prayerTimes);
      res.json(prayers);
    } catch (error) {
      res.status(400).json({ message: "Failed to generate prayers" });
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

  const httpServer = createServer(app);
  return httpServer;
}
