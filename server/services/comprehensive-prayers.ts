import { format, addMinutes, subMinutes } from "date-fns";

export interface ComprehensivePrayer {
  name: string;
  displayName: string;
  type: 'fard' | 'sunnah' | 'nafl' | 'witr';
  category: 'before_fajr' | 'fajr' | 'duha' | 'before_dhuhr' | 'dhuhr' | 'after_dhuhr' | 'before_asr' | 'asr' | 'after_asr' | 'maghrib' | 'after_maghrib' | 'before_isha' | 'isha' | 'after_isha' | 'witr' | 'tahajjud';
  time: string;
  rakats: number;
  description: string;
  isOptional: boolean;
  priority: number; // 1 = highest priority
}

export interface DailyPrayerSchedule {
  date: string;
  prayers: ComprehensivePrayer[];
  prayerTimes: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}

export function generateComprehensivePrayerSchedule(
  date: string,
  prayerTimes: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  }
): DailyPrayerSchedule {
  const prayers: ComprehensivePrayer[] = [];

  // Helper function to calculate time offsets
  const offsetTime = (timeStr: string, offsetMinutes: number): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const newTime = offsetMinutes > 0 ? addMinutes(date, offsetMinutes) : subMinutes(date, Math.abs(offsetMinutes));
    return format(newTime, 'HH:mm');
  };

  // 1. Tahajjud (Late night prayer) - 1/3 of night before Fajr
  const tahajjudTime = offsetTime(prayerTimes.fajr, -90); // 1.5 hours before Fajr
  prayers.push({
    name: 'tahajjud',
    displayName: 'Tahajjud',
    type: 'nafl',
    category: 'tahajjud',
    time: tahajjudTime,
    rakats: 8,
    description: 'Night prayer - highly recommended voluntary prayer',
    isOptional: true,
    priority: 5
  });

  // 2. Fajr Sunnah (2 rakats before Fajr)
  prayers.push({
    name: 'fajr_sunnah',
    displayName: 'Fajr Sunnah',
    type: 'sunnah',
    category: 'before_fajr',
    time: offsetTime(prayerTimes.fajr, -15),
    rakats: 2,
    description: 'Sunnah prayer before Fajr - highly emphasized',
    isOptional: false,
    priority: 2
  });

  // 3. Fajr Fard (Obligatory)
  prayers.push({
    name: 'fajr_fard',
    displayName: 'Fajr',
    type: 'fard',
    category: 'fajr',
    time: prayerTimes.fajr,
    rakats: 2,
    description: 'Dawn prayer - obligatory',
    isOptional: false,
    priority: 1
  });

  // 4. Duha (Forenoon prayer)
  const duhaTime = offsetTime(prayerTimes.sunrise, 30); // 30 minutes after sunrise
  prayers.push({
    name: 'duha',
    displayName: 'Duha',
    type: 'nafl',
    category: 'duha',
    time: duhaTime,
    rakats: 2,
    description: 'Forenoon prayer - recommended voluntary prayer',
    isOptional: true,
    priority: 6
  });

  // 5. Dhuhr Sunnah (4 rakats before Dhuhr)
  prayers.push({
    name: 'dhuhr_sunnah_before',
    displayName: 'Dhuhr Sunnah (Before)',
    type: 'sunnah',
    category: 'before_dhuhr',
    time: offsetTime(prayerTimes.dhuhr, -15),
    rakats: 4,
    description: 'Sunnah prayer before Dhuhr',
    isOptional: false,
    priority: 3
  });

  // 6. Dhuhr Fard (Obligatory)
  prayers.push({
    name: 'dhuhr_fard',
    displayName: 'Dhuhr',
    type: 'fard',
    category: 'dhuhr',
    time: prayerTimes.dhuhr,
    rakats: 4,
    description: 'Midday prayer - obligatory',
    isOptional: false,
    priority: 1
  });

  // 7. Dhuhr Sunnah (2 rakats after Dhuhr)
  prayers.push({
    name: 'dhuhr_sunnah_after',
    displayName: 'Dhuhr Sunnah (After)',
    type: 'sunnah',
    category: 'after_dhuhr',
    time: offsetTime(prayerTimes.dhuhr, 10),
    rakats: 2,
    description: 'Sunnah prayer after Dhuhr',
    isOptional: false,
    priority: 3
  });

  // 8. Asr Sunnah (4 rakats before Asr) - Optional
  prayers.push({
    name: 'asr_sunnah_before',
    displayName: 'Asr Sunnah (Before)',
    type: 'sunnah',
    category: 'before_asr',
    time: offsetTime(prayerTimes.asr, -15),
    rakats: 4,
    description: 'Sunnah prayer before Asr - optional',
    isOptional: true,
    priority: 7
  });

  // 9. Asr Fard (Obligatory)
  prayers.push({
    name: 'asr_fard',
    displayName: 'Asr',
    type: 'fard',
    category: 'asr',
    time: prayerTimes.asr,
    rakats: 4,
    description: 'Afternoon prayer - obligatory',
    isOptional: false,
    priority: 1
  });

  // 10. Maghrib Fard (Obligatory)
  prayers.push({
    name: 'maghrib_fard',
    displayName: 'Maghrib',
    type: 'fard',
    category: 'maghrib',
    time: prayerTimes.maghrib,
    rakats: 3,
    description: 'Sunset prayer - obligatory',
    isOptional: false,
    priority: 1
  });

  // 11. Maghrib Sunnah (2 rakats after Maghrib)
  prayers.push({
    name: 'maghrib_sunnah_after',
    displayName: 'Maghrib Sunnah',
    type: 'sunnah',
    category: 'after_maghrib',
    time: offsetTime(prayerTimes.maghrib, 10),
    rakats: 2,
    description: 'Sunnah prayer after Maghrib',
    isOptional: false,
    priority: 3
  });

  // 12. Isha Sunnah (4 rakats before Isha) - Optional
  prayers.push({
    name: 'isha_sunnah_before',
    displayName: 'Isha Sunnah (Before)',
    type: 'sunnah',
    category: 'before_isha',
    time: offsetTime(prayerTimes.isha, -15),
    rakats: 4,
    description: 'Sunnah prayer before Isha - optional',
    isOptional: true,
    priority: 7
  });

  // 13. Isha Fard (Obligatory)
  prayers.push({
    name: 'isha_fard',
    displayName: 'Isha',
    type: 'fard',
    category: 'isha',
    time: prayerTimes.isha,
    rakats: 4,
    description: 'Night prayer - obligatory',
    isOptional: false,
    priority: 1
  });

  // 14. Isha Sunnah (2 rakats after Isha)
  prayers.push({
    name: 'isha_sunnah_after',
    displayName: 'Isha Sunnah',
    type: 'sunnah',
    category: 'after_isha',
    time: offsetTime(prayerTimes.isha, 10),
    rakats: 2,
    description: 'Sunnah prayer after Isha',
    isOptional: false,
    priority: 3
  });

  // 15. Witr (Final prayer of the day)
  prayers.push({
    name: 'witr',
    displayName: 'Witr',
    type: 'witr',
    category: 'witr',
    time: offsetTime(prayerTimes.isha, 30),
    rakats: 3,
    description: 'Witr prayer - strongly recommended',
    isOptional: false,
    priority: 2
  });

  // Sort prayers by time
  prayers.sort((a, b) => a.time.localeCompare(b.time));

  return {
    date,
    prayers,
    prayerTimes
  };
}

export function getPrayerTypeColor(type: ComprehensivePrayer['type']): string {
  switch (type) {
    case 'fard':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'sunnah':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'nafl':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'witr':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function getPrayerTypeIcon(type: ComprehensivePrayer['type']): string {
  switch (type) {
    case 'fard':
      return '🕌'; // Required
    case 'sunnah':
      return '⭐'; // Recommended
    case 'nafl':
      return '✨'; // Optional
    case 'witr':
      return '🌙'; // Night prayer
    default:
      return '🤲';
  }
}