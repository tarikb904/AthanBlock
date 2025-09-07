import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, differenceInSeconds } from "date-fns";
import { useAuth } from "@/lib/auth";

interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export function PrayerTimesDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const today = format(new Date(), "yyyy-MM-dd");

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: prayerTimesData, isLoading } = useQuery<PrayerTimesData>({
    queryKey: ["/api/prayer-times", today],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading prayer times...</p>
        </CardContent>
      </Card>
    );
  }

  // Use fetched prayer times or create default times
  const todayPrayerTimes = prayerTimesData || {
    fajr: "05:30",
    sunrise: "06:45", 
    dhuhr: "12:15",
    asr: "15:30",
    maghrib: "18:45",
    isha: "20:00"
  };

  // Create prayer times array with proper time parsing
  const prayerTimes = [
    { name: "Fajr", time: todayPrayerTimes.fajr },
    { name: "Sunrise", time: todayPrayerTimes.sunrise },
    { name: "Dhuhr", time: todayPrayerTimes.dhuhr },
    { name: "Asr", time: todayPrayerTimes.asr },
    { name: "Maghrib", time: todayPrayerTimes.maghrib },
    { name: "Isha", time: todayPrayerTimes.isha },
  ];

  // Find the next upcoming prayer
  const findNextPrayer = () => {
    const now = new Date();
    
    for (const prayer of prayerTimes) {
      // Parse the prayer time (format: "HH:MM")
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0, 0);
      
      if (isAfter(prayerDate, now)) {
        return { ...prayer, date: prayerDate };
      }
    }
    
    // If no prayer today is upcoming, return tomorrow's Fajr
    const tomorrowFajr = new Date();
    const [hours, minutes] = prayerTimes[0].time.split(':').map(Number);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    tomorrowFajr.setHours(hours, minutes, 0, 0);
    
    return { ...prayerTimes[0], date: tomorrowFajr };
  };

  const nextPrayer = findNextPrayer();

  // Calculate countdown to next prayer
  const getCountdown = () => {
    if (!nextPrayer) return { hours: 0, minutes: 0, seconds: 0 };
    
    const secondsLeft = differenceInSeconds(nextPrayer.date, currentTime);
    if (secondsLeft <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    
    return { hours, minutes, seconds };
  };

  const countdown = getCountdown();

  // Format time to 12-hour format
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit", 
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Today's Timings:</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {prayerTimes.map((prayer) => {
            const isNext = nextPrayer?.name === prayer.name;
            
            return (
              <Card 
                key={prayer.name}
                className={`text-center transition-all ${
                  isNext 
                    ? "bg-blue-500 text-white shadow-lg scale-105" 
                    : "bg-white dark:bg-gray-800 hover:shadow-md"
                }`}
              >
                <CardContent className="p-6 space-y-2">
                  {isNext && (
                    <div className="text-sm font-medium opacity-90 mb-2">
                      Upcoming Prayer
                    </div>
                  )}
                  
                  <h3 className={`text-lg font-semibold ${
                    isNext ? "text-white" : "text-foreground"
                  }`}>
                    {prayer.name}
                  </h3>
                  
                  <div className={`text-2xl font-bold font-mono ${
                    isNext ? "text-white" : "text-foreground"
                  }`}>
                    {formatTime(prayer.time)}
                  </div>
                  
                  {isNext && (
                    <div className="space-y-1 mt-4">
                      <div className="text-sm opacity-90">
                        hrs&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;min&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sec
                      </div>
                      <div className="text-3xl font-bold font-mono">
                        {String(countdown.hours).padStart(2, '0')}:
                        {String(countdown.minutes).padStart(2, '0')}:
                        {String(countdown.seconds).padStart(2, '0')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}