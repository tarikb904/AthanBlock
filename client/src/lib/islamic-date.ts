export interface IslamicDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  formatted: string;
}

export const islamicMonths = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

export function gregorianToIslamic(gregorianDate: Date): IslamicDate {
  // Simplified Islamic date conversion
  // In production, use a proper library like @js-temporal/polyfill or hijri-date
  
  const ISLAMIC_EPOCH = 1948439.5; // Julian day number for 1/1/1 AH
  const julianDay = Math.floor(gregorianDate.getTime() / 86400000) + 2440588;
  
  const islamicDaysSinceEpoch = julianDay - ISLAMIC_EPOCH;
  const islamicYear = Math.floor((islamicDaysSinceEpoch * 30) / 10631) + 1;
  
  // Approximate calculation - in production use proper algorithms
  const yearStart = Math.floor((islamicYear - 1) * 10631 / 30) + ISLAMIC_EPOCH;
  const dayOfYear = Math.floor(islamicDaysSinceEpoch - yearStart + ISLAMIC_EPOCH + 1);
  
  let month = 1;
  let dayOfMonth = dayOfYear;
  
  // Islamic months alternate between 30 and 29 days
  for (let i = 1; i <= 12; i++) {
    const monthLength = i % 2 === 1 ? 30 : 29;
    if (dayOfMonth <= monthLength) {
      month = i;
      break;
    }
    dayOfMonth -= monthLength;
  }

  return {
    day: Math.max(1, Math.min(30, dayOfMonth)),
    month: month,
    year: islamicYear,
    monthName: islamicMonths[month - 1],
    formatted: `${Math.max(1, Math.min(30, dayOfMonth))} ${islamicMonths[month - 1]} ${islamicYear}`,
  };
}

export function getCurrentIslamicDate(): string {
  const islamicDate = gregorianToIslamic(new Date());
  return islamicDate.formatted;
}

export function isRamadan(islamicDate?: IslamicDate): boolean {
  const currentIslamic = islamicDate || gregorianToIslamic(new Date());
  return currentIslamic.month === 9; // Ramadan is the 9th month
}

export function getRamadanProgress(islamicDate?: IslamicDate): { day: number; total: number; percentage: number } {
  const currentIslamic = islamicDate || gregorianToIslamic(new Date());
  
  if (currentIslamic.month !== 9) {
    return { day: 0, total: 30, percentage: 0 };
  }
  
  const day = currentIslamic.day;
  const total = 30; // Ramadan has 29-30 days
  const percentage = Math.round((day / total) * 100);
  
  return { day, total, percentage };
}

export function getIslamicHolidays(islamicYear: number): Array<{ name: string; month: number; day: number }> {
  return [
    { name: "New Year (Muharram)", month: 1, day: 1 },
    { name: "Day of Ashura", month: 1, day: 10 },
    { name: "Mawlid an-Nabi", month: 3, day: 12 },
    { name: "Laylat al-Mi'raj", month: 7, day: 27 },
    { name: "Laylat al-Bara'ah", month: 8, day: 15 },
    { name: "Start of Ramadan", month: 9, day: 1 },
    { name: "Laylat al-Qadr", month: 9, day: 27 },
    { name: "Eid al-Fitr", month: 10, day: 1 },
    { name: "Eid al-Adha", month: 12, day: 10 },
  ];
}

export function formatIslamicDate(islamicDate: IslamicDate, format: "short" | "long" = "long"): string {
  if (format === "short") {
    return `${islamicDate.day}/${islamicDate.month}/${islamicDate.year}`;
  }
  
  return `${islamicDate.day} ${islamicDate.monthName} ${islamicDate.year}`;
}
