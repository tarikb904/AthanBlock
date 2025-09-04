export interface PrayerTime {
  name: string;
  time: Date;
  completed: boolean;
}

export interface CalculationMethod {
  name: string;
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval?: number;
  maghribAngle?: number;
}

export const calculationMethods: Record<string, CalculationMethod> = {
  ISNA: {
    name: "Islamic Society of North America",
    fajrAngle: 15,
    ishaAngle: 15,
  },
  MWL: {
    name: "Muslim World League",
    fajrAngle: 18,
    ishaAngle: 17,
  },
  Egypt: {
    name: "Egyptian General Authority",
    fajrAngle: 19.5,
    ishaAngle: 17.5,
  },
  Makkah: {
    name: "Umm Al-Qura University, Makkah",
    fajrAngle: 18.5,
    ishaInterval: 90, // minutes after Maghrib
  },
};

export function getCurrentPrayerTimes(location: string, method: string = "ISNA"): Omit<PrayerTime, "completed">[] {
  // This is a simplified prayer time calculation
  // In a real app, you would use a proper library like @aladhan/aladhan-js
  // or implement the complete astronomical calculations
  
  const today = new Date();
  const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Simplified static times for demo - in production use proper calculation
  const prayerTimes = [
    { name: "Fajr", hour: 5, minute: 23 },
    { name: "Dhuhr", hour: 12, minute: 15 },
    { name: "Asr", hour: 15, minute: 45 },
    { name: "Maghrib", hour: 19, minute: 21 },
    { name: "Isha", hour: 20, minute: 45 },
  ];

  return prayerTimes.map(prayer => ({
    name: prayer.name,
    time: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), prayer.hour, prayer.minute),
  }));
}

export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (const prayer of prayers) {
    const prayerTime = prayer.time.getHours() * 60 + prayer.time.getMinutes();
    if (prayerTime > currentTime && !prayer.completed) {
      return prayer;
    }
  }

  // If no prayer is found for today, return the first prayer of tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return prayers[0] ? {
    ...prayers[0],
    time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 
      prayers[0].time.getHours(), prayers[0].time.getMinutes()),
  } : null;
}

export function getPrayerIcon(prayerName: string): string {
  const iconMap: Record<string, string> = {
    Fajr: "fas fa-sun",
    Dhuhr: "fas fa-sun", 
    Asr: "fas fa-sun",
    Maghrib: "fas fa-moon",
    Isha: "fas fa-star",
  };
  
  return iconMap[prayerName] || "fas fa-circle";
}

export function calculateQiblaDirection(latitude: number, longitude: number): number {
  // Kaaba coordinates
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;
  
  const dLng = (kaabaLng - longitude) * Math.PI / 180;
  const lat1 = latitude * Math.PI / 180;
  const lat2 = kaabaLat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  
  return bearing;
}

export function adjustPrayerTimeForMadhab(time: Date, prayer: string, madhab: string): Date {
  // Hanafi madhab has different Asr calculation
  if (prayer === "Asr" && madhab === "Hanafi") {
    // Hanafi Asr is when shadow length = object length + morning shadow length
    // This typically makes Asr later than Shafi calculation
    const adjustedTime = new Date(time);
    adjustedTime.setMinutes(adjustedTime.getMinutes() + 15);
    return adjustedTime;
  }
  
  return time;
}
