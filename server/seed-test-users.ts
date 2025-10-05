import { storage } from "./storage";
import { randomUUID } from "crypto";

// 30 Test users from different global locations
const testUsers = [
  { name: "Ahmed Hassan", email: "ahmed.hassan@test.com", location: "Cairo, Egypt", lat: "30.0444", lon: "31.2357", timezone: "Africa/Cairo", prayerMethod: 5, madhab: 1 },
  { name: "Fatima Ali", email: "fatima.ali@test.com", location: "Dubai, UAE", lat: "25.2048", lon: "55.2708", timezone: "Asia/Dubai", prayerMethod: 4, madhab: 1 },
  { name: "Muhammad Khan", email: "muhammad.khan@test.com", location: "Karachi, Pakistan", lat: "24.8607", lon: "67.0011", timezone: "Asia/Karachi", prayerMethod: 1, madhab: 1 },
  { name: "Aisha Rahman", email: "aisha.rahman@test.com", location: "Dhaka, Bangladesh", lat: "23.8103", lon: "90.4125", timezone: "Asia/Dhaka", prayerMethod: 1, madhab: 1 },
  { name: "Omar Abdullah", email: "omar.abdullah@test.com", location: "Istanbul, Turkey", lat: "41.0082", lon: "28.9784", timezone: "Europe/Istanbul", prayerMethod: 3, madhab: 1 },
  { name: "Khadija Mohamed", email: "khadija.mohamed@test.com", location: "Mogadishu, Somalia", lat: "2.0469", lon: "45.3182", timezone: "Africa/Mogadishu", prayerMethod: 5, madhab: 0 },
  { name: "Ibrahim Yusuf", email: "ibrahim.yusuf@test.com", location: "Lagos, Nigeria", lat: "6.5244", lon: "3.3792", timezone: "Africa/Lagos", prayerMethod: 5, madhab: 0 },
  { name: "Zainab Ahmed", email: "zainab.ahmed@test.com", location: "Riyadh, Saudi Arabia", lat: "24.7136", lon: "46.6753", timezone: "Asia/Riyadh", prayerMethod: 4, madhab: 1 },
  { name: "Hassan Mahmoud", email: "hassan.mahmoud@test.com", location: "London, UK", lat: "51.5074", lon: "-0.1278", timezone: "Europe/London", prayerMethod: 2, madhab: 1 },
  { name: "Maryam Hussain", email: "maryam.hussain@test.com", location: "New York, USA", lat: "40.7128", lon: "-74.0060", timezone: "America/New_York", prayerMethod: 2, madhab: 0 },
  { name: "Ali Hassan", email: "ali.hassan@test.com", location: "Toronto, Canada", lat: "43.6532", lon: "-79.3832", timezone: "America/Toronto", prayerMethod: 2, madhab: 1 },
  { name: "Yasmin Khan", email: "yasmin.khan@test.com", location: "Sydney, Australia", lat: "-33.8688", lon: "151.2093", timezone: "Australia/Sydney", prayerMethod: 3, madhab: 0 },
  { name: "Bilal Ahmed", email: "bilal.ahmed@test.com", location: "Jakarta, Indonesia", lat: "-6.2088", lon: "106.8456", timezone: "Asia/Jakarta", prayerMethod: 3, madhab: 0 },
  { name: "Salma Abdullah", email: "salma.abdullah@test.com", location: "Kuala Lumpur, Malaysia", lat: "3.1390", lon: "101.6869", timezone: "Asia/Kuala_Lumpur", prayerMethod: 3, madhab: 0 },
  { name: "Tariq Malik", email: "tariq.malik@test.com", location: "Lahore, Pakistan", lat: "31.5204", lon: "74.3587", timezone: "Asia/Karachi", prayerMethod: 1, madhab: 1 },
  { name: "Nadia Rahman", email: "nadia.rahman@test.com", location: "Amman, Jordan", lat: "31.9454", lon: "35.9284", timezone: "Asia/Amman", prayerMethod: 5, madhab: 1 },
  { name: "Hamza Mohamed", email: "hamza.mohamed@test.com", location: "Casablanca, Morocco", lat: "33.5731", lon: "-7.5898", timezone: "Africa/Casablanca", prayerMethod: 5, madhab: 0 },
  { name: "Layla Hassan", email: "layla.hassan@test.com", location: "Baghdad, Iraq", lat: "33.3152", lon: "44.3661", timezone: "Asia/Baghdad", prayerMethod: 5, madhab: 1 },
  { name: "Yusuf Ali", email: "yusuf.ali@test.com", location: "Tehran, Iran", lat: "35.6892", lon: "51.3890", timezone: "Asia/Tehran", prayerMethod: 7, madhab: 1 },
  { name: "Amina Abdullah", email: "amina.abdullah@test.com", location: "Kabul, Afghanistan", lat: "34.5553", lon: "69.2075", timezone: "Asia/Kabul", prayerMethod: 1, madhab: 1 },
  { name: "Khalid Mahmoud", email: "khalid.mahmoud@test.com", location: "Berlin, Germany", lat: "52.5200", lon: "13.4050", timezone: "Europe/Berlin", prayerMethod: 3, madhab: 1 },
  { name: "Huda Yusuf", email: "huda.yusuf@test.com", location: "Paris, France", lat: "48.8566", lon: "2.3522", timezone: "Europe/Paris", prayerMethod: 3, madhab: 0 },
  { name: "Rashid Khan", email: "rashid.khan@test.com", location: "Doha, Qatar", lat: "25.2854", lon: "51.5310", timezone: "Asia/Qatar", prayerMethod: 4, madhab: 1 },
  { name: "Sumaya Ahmed", email: "sumaya.ahmed@test.com", location: "Muscat, Oman", lat: "23.5880", lon: "58.3829", timezone: "Asia/Muscat", prayerMethod: 4, madhab: 1 },
  { name: "Faisal Hassan", email: "faisal.hassan@test.com", location: "Kuwait City, Kuwait", lat: "29.3759", lon: "47.9774", timezone: "Asia/Kuwait", prayerMethod: 4, madhab: 1 },
  { name: "Amal Mohamed", email: "amal.mohamed@test.com", location: "Tunis, Tunisia", lat: "36.8065", lon: "10.1815", timezone: "Africa/Tunis", prayerMethod: 5, madhab: 0 },
  { name: "Saeed Ali", email: "saeed.ali@test.com", location: "Sana'a, Yemen", lat: "15.5527", lon: "48.5164", timezone: "Asia/Aden", prayerMethod: 4, madhab: 0 },
  { name: "Halima Khan", email: "halima.khan@test.com", location: "Khartoum, Sudan", lat: "15.5007", lon: "32.5599", timezone: "Africa/Khartoum", prayerMethod: 5, madhab: 0 },
  { name: "Usman Abdullah", email: "usman.abdullah@test.com", location: "Algiers, Algeria", lat: "36.7538", lon: "3.0588", timezone: "Africa/Algiers", prayerMethod: 5, madhab: 0 },
  { name: "Safiya Hassan", email: "safiya.hassan@test.com", location: "Tripoli, Libya", lat: "32.8872", lon: "13.1913", timezone: "Africa/Tripoli", prayerMethod: 5, madhab: 0 },
];

interface TestResult {
  userId: string;
  email: string;
  password: string;
  name: string;
  location: string;
  authToken: string;
  tests: {
    registration: boolean;
    authentication: boolean;
    profileUpdate: boolean;
    prayerCreation: boolean;
    adhkarAccess: boolean;
    timeBlockCreation: boolean;
  };
  errors: string[];
}

export async function seedTestUsers(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const password = "Test@1234"; // Same password for all test users

  console.log("\n🚀 Starting test user creation and validation...\n");

  for (let i = 0; i < testUsers.length; i++) {
    const userData = testUsers[i];
    const result: TestResult = {
      userId: "",
      email: userData.email,
      password: password,
      name: userData.name,
      location: userData.location,
      authToken: "",
      tests: {
        registration: false,
        authentication: false,
        profileUpdate: false,
        prayerCreation: false,
        adhkarAccess: false,
        timeBlockCreation: false,
      },
      errors: [],
    };

    try {
      console.log(`[${i + 1}/30] Testing user: ${userData.name} from ${userData.location}`);

      // Test 1: Registration
      try {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (existingUser) {
          console.log(`   ⚠️  User already exists, skipping registration`);
          result.userId = existingUser.id;
          result.authToken = existingUser.authToken || "";
          result.tests.registration = true;
        } else {
          const authToken = randomUUID();
          const user = await storage.createUser({
            email: userData.email,
            password: password,
            name: userData.name,
            authToken: authToken,
            location: userData.location,
            locationLat: userData.lat,
            locationLon: userData.lon,
            timezone: userData.timezone,
            prayerMethod: userData.prayerMethod,
            madhab: userData.madhab,
            language: "en",
            darkMode: true,
            notifications: true,
            onboardingCompleted: true,
          });
          result.userId = user.id;
          result.authToken = authToken;
          result.tests.registration = true;
          console.log(`   ✅ Registration successful`);
        }
      } catch (error) {
        result.errors.push(`Registration failed: ${error}`);
        console.log(`   ❌ Registration failed: ${error}`);
      }

      // Test 2: Authentication (token-based)
      if (result.authToken) {
        try {
          const user = await storage.getUserByToken(result.authToken);
          if (user && user.id === result.userId) {
            result.tests.authentication = true;
            console.log(`   ✅ Authentication successful`);
          } else {
            result.errors.push("Token authentication failed");
            console.log(`   ❌ Token authentication failed`);
          }
        } catch (error) {
          result.errors.push(`Authentication error: ${error}`);
          console.log(`   ❌ Authentication error: ${error}`);
        }
      }

      // Test 3: Profile Update
      if (result.userId) {
        try {
          const updated = await storage.updateUser(result.userId, {
            onboardingCompleted: true,
          });
          if (updated) {
            result.tests.profileUpdate = true;
            console.log(`   ✅ Profile update successful`);
          } else {
            result.errors.push("Profile update returned undefined");
            console.log(`   ❌ Profile update failed`);
          }
        } catch (error) {
          result.errors.push(`Profile update error: ${error}`);
          console.log(`   ❌ Profile update error: ${error}`);
        }
      }

      // Test 4: Prayer Creation
      if (result.userId) {
        try {
          const today = new Date().toISOString().split("T")[0];
          const prayer = await storage.createPrayer({
            userId: result.userId,
            name: "Fajr",
            time: "05:30",
            date: today,
            completed: false,
          });
          if (prayer) {
            result.tests.prayerCreation = true;
            console.log(`   ✅ Prayer creation successful`);
          }
        } catch (error) {
          result.errors.push(`Prayer creation error: ${error}`);
          console.log(`   ❌ Prayer creation error: ${error}`);
        }
      }

      // Test 5: Adhkar Access
      try {
        const adhkarList = await storage.getAllAdhkar();
        if (adhkarList && adhkarList.length > 0) {
          result.tests.adhkarAccess = true;
          console.log(`   ✅ Adhkar access successful (${adhkarList.length} available)`);
        } else {
          result.errors.push("No adhkar found");
          console.log(`   ❌ No adhkar found`);
        }
      } catch (error) {
        result.errors.push(`Adhkar access error: ${error}`);
        console.log(`   ❌ Adhkar access error: ${error}`);
      }

      // Test 6: Time Block Creation
      if (result.userId) {
        try {
          const today = new Date().toISOString().split("T")[0];
          const timeBlock = await storage.createTimeBlock({
            userId: result.userId,
            title: "Morning Prayer",
            description: "Fajr prayer and morning adhkar",
            startTime: "05:30:00",
            duration: 30,
            category: "prayer",
            icon: "sun",
            color: "blue",
            date: today,
            isTemplate: false,
            completed: false,
            tasks: [],
          });
          if (timeBlock) {
            result.tests.timeBlockCreation = true;
            console.log(`   ✅ Time block creation successful`);
          }
        } catch (error) {
          result.errors.push(`Time block creation error: ${error}`);
          console.log(`   ❌ Time block creation error: ${error}`);
        }
      }

      const passedTests = Object.values(result.tests).filter((t) => t).length;
      console.log(`   📊 Tests passed: ${passedTests}/6\n`);
    } catch (error) {
      result.errors.push(`Unexpected error: ${error}`);
      console.log(`   ❌ Unexpected error: ${error}\n`);
    }

    results.push(result);
  }

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(80) + "\n");

  const totalUsers = results.length;
  const successfulRegistrations = results.filter((r) => r.tests.registration).length;
  const successfulAuthentications = results.filter((r) => r.tests.authentication).length;
  const fullyFunctional = results.filter((r) => Object.values(r.tests).every((t) => t)).length;

  console.log(`Total Users Tested: ${totalUsers}`);
  console.log(`Successful Registrations: ${successfulRegistrations}/${totalUsers}`);
  console.log(`Successful Authentications: ${successfulAuthentications}/${totalUsers}`);
  console.log(`Fully Functional Users: ${fullyFunctional}/${totalUsers}`);
  console.log("\n" + "=".repeat(80));
  console.log("👥 USER CREDENTIALS");
  console.log("=".repeat(80) + "\n");

  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Email: ${r.email}`);
    console.log(`   Password: ${r.password}`);
    console.log(`   Location: ${r.location}`);
    console.log(`   User ID: ${r.userId}`);
    console.log(`   Token: ${r.authToken}`);
    const passedTests = Object.values(r.tests).filter((t) => t).length;
    console.log(`   Status: ${passedTests}/6 tests passed ${passedTests === 6 ? "✅" : "⚠️"}`);
    if (r.errors.length > 0) {
      console.log(`   Errors: ${r.errors.join(", ")}`);
    }
    console.log("");
  });

  console.log("=".repeat(80) + "\n");

  return results;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestUsers()
    .then((results) => {
      console.log("✅ Test user seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Test user seeding failed:", error);
      process.exit(1);
    });
}
