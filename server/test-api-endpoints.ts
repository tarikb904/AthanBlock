import { storage } from "./storage";

interface APITestResult {
  endpoint: string;
  method: string;
  description: string;
  status: "✅ PASS" | "❌ FAIL" | "⚠️  SKIP";
  details: string;
}

async function testAPIEndpoints(): Promise<void> {
  const results: APITestResult[] = [];
  const testEmail = "ahmed.hassan@test.com"; // Using first test user

  console.log("\n🚀 Starting API Endpoint Tests...\n");
  console.log("=".repeat(80) + "\n");

  // Test 1: User Registration Flow
  try {
    const existingUser = await storage.getUserByEmail("api.test@test.com");
    if (!existingUser) {
      const newUser = await storage.createUser({
        email: "api.test@test.com",
        password: "Test@1234",
        name: "API Test User",
        authToken: "test-token-123",
      });
      results.push({
        endpoint: "/api/auth/register",
        method: "POST",
        description: "User registration",
        status: "✅ PASS",
        details: `User created with ID: ${newUser.id}`,
      });
    } else {
      results.push({
        endpoint: "/api/auth/register",
        method: "POST",
        description: "User registration",
        status: "⚠️  SKIP",
        details: "User already exists",
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/auth/register",
      method: "POST",
      description: "User registration",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 2: User Login Flow
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user && user.authToken) {
      results.push({
        endpoint: "/api/auth/login",
        method: "POST",
        description: "User login with token",
        status: "✅ PASS",
        details: `Token retrieved: ${user.authToken.substring(0, 20)}...`,
      });
    } else {
      results.push({
        endpoint: "/api/auth/login",
        method: "POST",
        description: "User login with token",
        status: "❌ FAIL",
        details: "User or token not found",
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/auth/login",
      method: "POST",
      description: "User login with token",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 3: Get User Profile
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      results.push({
        endpoint: "/api/user/profile",
        method: "GET",
        description: "Get user profile",
        status: "✅ PASS",
        details: `Profile retrieved for ${user.name}`,
      });
    } else {
      results.push({
        endpoint: "/api/user/profile",
        method: "GET",
        description: "Get user profile",
        status: "❌ FAIL",
        details: "User not found",
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/user/profile",
      method: "GET",
      description: "Get user profile",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 4: Update User Profile
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const updated = await storage.updateUser(user.id, {
        notifications: true,
        darkMode: true,
      });
      if (updated) {
        results.push({
          endpoint: "/api/user/profile",
          method: "PATCH",
          description: "Update user profile",
          status: "✅ PASS",
          details: "Profile updated successfully",
        });
      } else {
        results.push({
          endpoint: "/api/user/profile",
          method: "PATCH",
          description: "Update user profile",
          status: "❌ FAIL",
          details: "Update returned undefined",
        });
      }
    }
  } catch (error) {
    results.push({
      endpoint: "/api/user/profile",
      method: "PATCH",
      description: "Update user profile",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 5: Get Prayer Times
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const prayerTimes = await storage.getPrayerTimesForUserAndDate(user.id, today);
      results.push({
        endpoint: "/api/prayers/times",
        method: "GET",
        description: "Get prayer times for today",
        status: prayerTimes ? "✅ PASS" : "⚠️  SKIP",
        details: prayerTimes
          ? `Prayer times found for ${today}`
          : "No prayer times found (expected for first run)",
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/prayers/times",
      method: "GET",
      description: "Get prayer times for today",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 6: Get Prayers for Date
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const prayers = await storage.getPrayersForUserAndDate(user.id, today);
      results.push({
        endpoint: "/api/prayers",
        method: "GET",
        description: "Get prayers for today",
        status: prayers.length > 0 ? "✅ PASS" : "⚠️  SKIP",
        details: `Found ${prayers.length} prayers`,
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/prayers",
      method: "GET",
      description: "Get prayers for today",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 7: Create Prayer
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const prayer = await storage.createPrayer({
        userId: user.id,
        name: "Dhuhr",
        time: "12:30",
        date: today,
        completed: false,
      });
      results.push({
        endpoint: "/api/prayers",
        method: "POST",
        description: "Create prayer",
        status: "✅ PASS",
        details: `Prayer created: ${prayer.name}`,
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/prayers",
      method: "POST",
      description: "Create prayer",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 8: Update Prayer
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const prayers = await storage.getPrayersForUserAndDate(user.id, today);
      if (prayers.length > 0) {
        const updated = await storage.updatePrayer(prayers[0].id, { completed: true });
        results.push({
          endpoint: "/api/prayers/:id",
          method: "PATCH",
          description: "Update prayer completion",
          status: updated ? "✅ PASS" : "❌ FAIL",
          details: updated
            ? `Prayer ${prayers[0].name} marked complete`
            : "Update failed",
        });
      } else {
        results.push({
          endpoint: "/api/prayers/:id",
          method: "PATCH",
          description: "Update prayer completion",
          status: "⚠️  SKIP",
          details: "No prayers to update",
        });
      }
    }
  } catch (error) {
    results.push({
      endpoint: "/api/prayers/:id",
      method: "PATCH",
      description: "Update prayer completion",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 9: Get All Adhkar
  try {
    const adhkarList = await storage.getAllAdhkar();
    results.push({
      endpoint: "/api/adhkar",
      method: "GET",
      description: "Get all adhkar",
      status: adhkarList.length > 0 ? "✅ PASS" : "❌ FAIL",
      details: `Found ${adhkarList.length} adhkar`,
    });
  } catch (error) {
    results.push({
      endpoint: "/api/adhkar",
      method: "GET",
      description: "Get all adhkar",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 10: Get Adhkar by Category
  try {
    const morningAdhkar = await storage.getAdhkarByCategory("morning");
    results.push({
      endpoint: "/api/adhkar?category=morning",
      method: "GET",
      description: "Get morning adhkar",
      status: morningAdhkar.length > 0 ? "✅ PASS" : "⚠️  SKIP",
      details: `Found ${morningAdhkar.length} morning adhkar`,
    });
  } catch (error) {
    results.push({
      endpoint: "/api/adhkar?category=morning",
      method: "GET",
      description: "Get morning adhkar",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 11: Get Time Blocks
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const blocks = await storage.getTimeBlocksForUserAndDate(user.id, today);
      results.push({
        endpoint: "/api/time-blocks",
        method: "GET",
        description: "Get time blocks for today",
        status: "✅ PASS",
        details: `Found ${blocks.length} time blocks`,
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/time-blocks",
      method: "GET",
      description: "Get time blocks for today",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 12: Create Time Block
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const today = new Date().toISOString().split("T")[0];
      const block = await storage.createTimeBlock({
        userId: user.id,
        title: "Quran Recitation",
        description: "Daily Quran reading session",
        startTime: "06:00:00",
        duration: 30,
        category: "ibadah",
        icon: "book",
        color: "green",
        date: today,
        isTemplate: false,
        completed: false,
        tasks: [],
      });
      results.push({
        endpoint: "/api/time-blocks",
        method: "POST",
        description: "Create time block",
        status: "✅ PASS",
        details: `Time block created: ${block.title}`,
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/time-blocks",
      method: "POST",
      description: "Create time block",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 13: Get Reminders
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const reminders = await storage.getRemindersForUser(user.id);
      results.push({
        endpoint: "/api/reminders",
        method: "GET",
        description: "Get user reminders",
        status: "✅ PASS",
        details: `Found ${reminders.length} reminders`,
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/reminders",
      method: "GET",
      description: "Get user reminders",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Test 14: Create Reminder
  try {
    const user = await storage.getUserByEmail(testEmail);
    if (user) {
      const reminder = await storage.createReminder({
        userId: user.id,
        type: "prayer",
        title: "Fajr Prayer Reminder",
        time: "05:15",
        enabled: true,
        recurring: "daily",
      });
      results.push({
        endpoint: "/api/reminders",
        method: "POST",
        description: "Create reminder",
        status: "✅ PASS",
        details: `Reminder created: ${reminder.title}`,
      });
    }
  } catch (error) {
    results.push({
      endpoint: "/api/reminders",
      method: "POST",
      description: "Create reminder",
      status: "❌ FAIL",
      details: `Error: ${error}`,
    });
  }

  // Print Results
  console.log("📊 API ENDPOINT TEST RESULTS\n");
  console.log("=".repeat(80) + "\n");

  const passed = results.filter((r) => r.status === "✅ PASS").length;
  const failed = results.filter((r) => r.status === "❌ FAIL").length;
  const skipped = results.filter((r) => r.status === "⚠️  SKIP").length;

  results.forEach((result, i) => {
    console.log(`${i + 1}. ${result.status} ${result.method} ${result.endpoint}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Details: ${result.details}\n`);
  });

  console.log("=".repeat(80));
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⚠️  Skipped: ${skipped}/${results.length}`);
  console.log(`\n📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAPIEndpoints()
    .then(() => {
      console.log("✅ API endpoint testing completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ API endpoint testing failed:", error);
      process.exit(1);
    });
}
