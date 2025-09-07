/**
 * Al-Adhan API Integration Service
 * 
 * Integrates with the Al-Adhan prayer times API to fetch accurate prayer times
 * based on geographical location, calculation method, and madhab (school of thought).
 * 
 * API Documentation: https://aladhan.com/prayer-times-api
 */

export interface AlAdhanPrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
  source: string;
  method: number;
  madhab: number;
  locationLat: string;
  locationLon: string;
}

export interface AlAdhanApiResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
      Midnight: string;
      Sunset: string;
    };
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
        };
        month: {
          number: number;
          en: string;
        };
        year: string;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
      };
      school: {
        id: number;
        name: string;
      };
    };
  };
}

/**
 * Prayer calculation methods supported by Al-Adhan API
 * See: https://aladhan.com/calculation-methods
 */
export const PRAYER_METHODS = {
  SHIA_ITHNA_ANSARI: 0,
  UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI: 1,
  ISLAMIC_SOCIETY_OF_NORTH_AMERICA: 2, // ISNA - Default for North America
  MUSLIM_WORLD_LEAGUE: 3, // MWL
  UMM_AL_QURA_MAKKAH: 4, // Saudi Arabia
  EGYPTIAN_GENERAL_AUTHORITY: 5,
  INSTITUTE_OF_GEOPHYSICS_TEHRAN: 7,
  GULF_REGION: 8,
  KUWAIT: 9,
  QATAR: 10,
  MAJLIS_UGAMA_ISLAM_SINGAPORE: 11,
  UNION_DES_ORGANISATIONS_ISLAMIQUES_DE_FRANCE: 12,
  DIYANET_TURKEY: 13,
  SPIRITUAL_ADMINISTRATION_OF_MUSLIMS_RUSSIA: 14,
  MOONSIGHTING_COMMITTEE_WORLDWIDE: 15,
  DUBAI: 16,
  JAKIM_MALAYSIA: 17,
  TUNISIA: 18,
  ALGERIA: 19,
  KEMENAG_INDONESIA: 20,
} as const;

/**
 * Madhab (School of thought) options
 */
export const MADHAB_SCHOOLS = {
  SHAFI: 0, // Shafi, Maliki, Hanbali
  HANAFI: 1, // Hanafi
} as const;

/**
 * Fetches prayer times from Al-Adhan API for a specific date and location
 * 
 * @param lat - Latitude (decimal)
 * @param lon - Longitude (decimal)  
 * @param method - Prayer calculation method (see PRAYER_METHODS)
 * @param madhab - School of thought (see MADHAB_SCHOOLS)
 * @param date - Date in YYYY-MM-DD format
 * @returns Promise<AlAdhanPrayerTimes> - Normalized prayer times object
 */
export async function fetchPrayerTimes(
  lat: number,
  lon: number,
  method: number,
  madhab: number,
  date: string
): Promise<AlAdhanPrayerTimes> {
  const baseUrl = process.env.ALADHAN_BASE_URL || 'http://api.aladhan.com/v1';
  const url = `${baseUrl}/timings/${date}?latitude=${lat}&longitude=${lon}&method=${method}&school=${madhab}`;
  
  try {
    console.log(`Fetching prayer times from Al-Adhan API: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Imaanify-App/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Al-Adhan API request failed: ${response.status} ${response.statusText}`);
    }

    const data: AlAdhanApiResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`Al-Adhan API error: ${data.status}`);
    }

    // Extract and normalize prayer times
    const timings = data.data.timings;
    
    return {
      fajr: formatTime(timings.Fajr),
      sunrise: formatTime(timings.Sunrise),
      dhuhr: formatTime(timings.Dhuhr),
      asr: formatTime(timings.Asr),
      maghrib: formatTime(timings.Maghrib),
      isha: formatTime(timings.Isha),
      date: date,
      source: 'aladhan',
      method: method,
      madhab: madhab,
      locationLat: lat.toString(),
      locationLon: lon.toString(),
    };
    
  } catch (error) {
    console.error('Failed to fetch prayer times from Al-Adhan API:', error);
    throw new Error(`Prayer times fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches prayer times for multiple days
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @param method - Prayer calculation method
 * @param madhab - School of thought
 * @param startDate - Start date in YYYY-MM-DD format
 * @param days - Number of days to fetch (default: 7)
 * @returns Promise<AlAdhanPrayerTimes[]> - Array of prayer times
 */
export async function fetchPrayerTimesRange(
  lat: number,
  lon: number,
  method: number,
  madhab: number,
  startDate: string,
  days: number = 7
): Promise<AlAdhanPrayerTimes[]> {
  const promises: Promise<AlAdhanPrayerTimes>[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    promises.push(fetchPrayerTimes(lat, lon, method, madhab, dateStr));
  }
  
  try {
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Failed to fetch prayer times range:', error);
    throw error;
  }
}

/**
 * Validates location coordinates
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Validates prayer method
 */
export function validatePrayerMethod(method: number): boolean {
  return Object.values(PRAYER_METHODS).includes(method as any);
}

/**
 * Validates madhab school
 */
export function validateMadhab(madhab: number): boolean {
  return Object.values(MADHAB_SCHOOLS).includes(madhab as any);
}

/**
 * Formats time from Al-Adhan API (removes timezone info, keeps HH:MM format)
 * Al-Adhan returns times like "05:22 (+04)" - we want just "05:22"
 */
function formatTime(timeString: string): string {
  // Remove timezone info and extra spaces
  const cleanTime = timeString.split(' ')[0];
  
  // Ensure it's in HH:MM format
  if (!/^\d{2}:\d{2}$/.test(cleanTime)) {
    throw new Error(`Invalid time format from Al-Adhan API: ${timeString}`);
  }
  
  return cleanTime;
}

/**
 * Gets prayer method name by ID
 */
export function getPrayerMethodName(methodId: number): string {
  const methodEntries = Object.entries(PRAYER_METHODS);
  const found = methodEntries.find(([_, id]) => id === methodId);
  return found ? found[0].replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) : `Method ${methodId}`;
}

/**
 * Gets madhab name by ID
 */
export function getMadhabName(madhabId: number): string {
  const madhabEntries = Object.entries(MADHAB_SCHOOLS);
  const found = madhabEntries.find(([_, id]) => id === madhabId);
  return found ? found[0].toLowerCase().replace(/^\w/, c => c.toUpperCase()) : `School ${madhabId}`;
}