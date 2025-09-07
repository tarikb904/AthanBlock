import { Navigation } from "@/components/navigation";
import { PrayerTimesDashboard } from "@/components/prayer-times-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { getCurrentIslamicDate } from "@/lib/islamic-date";
import { CalendarDays, Clock, BookOpen, Target } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const islamicDate = getCurrentIslamicDate();
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long", 
    day: "numeric",
  });

  const stats = [
    { icon: Clock, label: "Prayer Streak", value: "12 days", color: "text-chart-1" },
    { icon: BookOpen, label: "Adhkar Completed", value: "85%", color: "text-chart-2" },
    { icon: Target, label: "Daily Goals", value: "4/6", color: "text-chart-3" },
    { icon: CalendarDays, label: "Weekly Progress", value: "67%", color: "text-chart-4" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-foreground font-serif">
                  As-salamu alaykum, {user?.name || 'User'}
                </h1>
                <p className="text-muted-foreground">
                  {currentDate} • {islamicDate}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold font-mono text-foreground" data-testid="text-current-time">
                  {currentTime}
                </div>
              </div>
            </div>
          </div>

          {/* Prayer Times Section */}
          <PrayerTimesDashboard />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-2">
                  <stat.icon className={`w-8 h-8 mx-auto ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/planner">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow time-block">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground text-lg">Daily Planner</h3>
                    <p className="text-muted-foreground">Organize your Islamic schedule</p>
                  </div>
                  <div className="flex items-center text-sm text-primary">
                    <span>4/7 blocks completed today</span>
                    <i className="fas fa-arrow-right ml-auto"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/adhkar">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow time-block">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-chart-2/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-chart-2" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground text-lg">Adhkar Library</h3>
                    <p className="text-muted-foreground">Daily remembrance & duas</p>
                  </div>
                  <div className="flex items-center text-sm text-chart-2">
                    <span>Morning adhkar pending</span>
                    <i className="fas fa-arrow-right ml-auto"></i>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-accent/10 border-accent">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground text-lg">Today's Focus</h3>
                  <p className="text-muted-foreground">Next: Asr prayer in 58 minutes</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-accent text-accent-foreground hover:bg-accent/20"
                  data-testid="button-set-reminder"
                >
                  Set Reminder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
