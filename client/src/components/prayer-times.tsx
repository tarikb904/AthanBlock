import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentPrayerTimes, getNextPrayer } from "@/lib/prayer-times";
import { format } from "date-fns";
import { Sun, Moon, Star, MapPin, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function PrayerTimes() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useState("New York, NY");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: prayers, isLoading } = useQuery({
    queryKey: ["/api/prayers", today],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const togglePrayerMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/prayers/${id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers", today] });
    },
  });

  // Generate prayer times if none exist
  useEffect(() => {
    if (prayers && prayers.length === 0) {
      const prayerTimes = getCurrentPrayerTimes(location);
      const generateMutation = async () => {
        await apiRequest("POST", `/api/prayers/${today}/generate`, { prayerTimes });
        queryClient.invalidateQueries({ queryKey: ["/api/prayers", today] });
      };
      generateMutation();
    }
  }, [prayers, location, today, queryClient]);

  const prayerIcons = {
    Fajr: Sun,
    Dhuhr: Sun,
    Asr: Sun,
    Maghrib: Moon,
    Isha: Star,
  };

  const nextPrayer = prayers ? getNextPrayer(prayers) : null;

  if (isLoading) {
    return (
      <Card className="prayer-glow">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading prayer times...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="prayer-glow bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                <span data-testid="text-location">{location}</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-card-foreground font-mono">
                  {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              </div>
            </div>
            
            {nextPrayer && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Next Prayer</div>
                <div className="text-2xl font-bold text-primary" data-testid="text-next-prayer-name">
                  {nextPrayer.name}
                </div>
                <div className="text-lg font-mono text-card-foreground" data-testid="text-next-prayer-time">
                  {nextPrayer.time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {prayers?.map((prayer: any) => {
          const IconComponent = prayerIcons[prayer.name as keyof typeof prayerIcons] || Sun;
          const isNext = nextPrayer?.name === prayer.name;
          
          return (
            <Card 
              key={prayer.id} 
              className={`text-center hover:shadow-lg transition-all ${
                isNext ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  isNext 
                    ? "bg-primary/20 pulse-gentle" 
                    : prayer.completed 
                      ? "bg-primary/20" 
                      : "bg-primary/10"
                }`}>
                  <IconComponent className={`w-5 h-5 ${
                    isNext ? "text-primary" : prayer.completed ? "text-primary" : "text-primary"
                  }`} />
                </div>
                
                <div>
                  <h3 className={`font-semibold ${
                    isNext ? "text-primary" : "text-card-foreground"
                  }`} data-testid={`text-prayer-name-${prayer.name.toLowerCase()}`}>
                    {prayer.name}
                  </h3>
                  <div className={`text-xl font-bold font-mono ${
                    isNext ? "text-primary" : "text-card-foreground"
                  }`} data-testid={`text-prayer-time-${prayer.name.toLowerCase()}`}>
                    {prayer.time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </div>
                  {isNext && (
                    <div className="text-xs text-primary font-medium">NEXT PRAYER</div>
                  )}
                </div>

                <Button
                  variant={prayer.completed ? "default" : "outline"}
                  size="sm"
                  className={`w-8 h-8 rounded-full p-0 ${
                    prayer.completed 
                      ? "bg-primary hover:bg-primary/90" 
                      : "border-primary hover:bg-primary/10"
                  }`}
                  onClick={() => togglePrayerMutation.mutate({ 
                    id: prayer.id, 
                    completed: !prayer.completed 
                  })}
                  data-testid={`button-toggle-prayer-${prayer.name.toLowerCase()}`}
                >
                  <i className={`fas fa-check text-xs ${
                    prayer.completed ? "text-primary-foreground" : "text-primary"
                  }`}></i>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Calculation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Prayer Calculation Settings
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Calculation Method</Label>
              <Select defaultValue="isna">
                <SelectTrigger data-testid="select-calculation-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isna">Islamic Society of North America (ISNA)</SelectItem>
                  <SelectItem value="mwl">Muslim World League</SelectItem>
                  <SelectItem value="egypt">Egyptian General Authority</SelectItem>
                  <SelectItem value="makkah">Umm Al-Qura University, Makkah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Madhab</Label>
              <Select defaultValue="hanafi">
                <SelectTrigger data-testid="select-madhab">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hanafi">Hanafi</SelectItem>
                  <SelectItem value="shafi">Shafi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Adjustment (minutes)</Label>
              <Input 
                type="number" 
                placeholder="± minutes" 
                className="text-center"
                data-testid="input-time-adjustment"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
