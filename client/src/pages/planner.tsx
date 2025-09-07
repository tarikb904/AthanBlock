import { Navigation } from "@/components/navigation";
import { TodayTimeline } from "@/components/today-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentIslamicDate } from "@/lib/islamic-date";

export default function Planner() {
  const islamicDate = getCurrentIslamicDate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif">Daily Islamic Planner</h1>
              <p className="text-muted-foreground">Structure your day around Islamic principles • {islamicDate}</p>
            </div>
          </div>

          {/* Today Timeline */}
          <TodayTimeline />
        </div>
      </main>
    </div>
  );
}
