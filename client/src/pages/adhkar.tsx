import { Navigation } from "@/components/navigation";
import { AdhkarCard } from "@/components/adhkar-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function Adhkar() {
  const [selectedCategory, setSelectedCategory] = useState("morning");

  const { data: adhkar, isLoading } = useQuery({
    queryKey: ["/api/adhkar", selectedCategory ? `?category=${selectedCategory}` : ""],
  });

  const { data: reminders } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const categories = [
    { id: "morning", label: "Morning", icon: "fas fa-sun" },
    { id: "evening", label: "Evening", icon: "fas fa-moon" },
    { id: "prayer", label: "Before Prayer", icon: "fas fa-pray" },
    { id: "sleep", label: "Before Sleep", icon: "fas fa-bed" },
    { id: "general", label: "General", icon: "fas fa-heart" },
  ];

  const morningReminders = reminders?.filter((r: any) => r.type === "adhkar" && r.title.includes("Morning")) || [];
  const eveningReminders = reminders?.filter((r: any) => r.type === "adhkar" && r.title.includes("Evening")) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground font-serif">Adhkar & Dua Library</h1>
            <p className="text-muted-foreground">Remember Allah throughout your day</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
                data-testid={`button-category-${category.id}`}
              >
                <i className={`${category.icon} text-sm`}></i>
                <span>{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Scheduled Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scheduled Reminders</CardTitle>
                <Button variant="outline" size="sm" data-testid="button-add-reminder">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {morningReminders.length > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground">Morning Adhkar</div>
                    <div className="text-sm text-muted-foreground">After Fajr prayer • Daily</div>
                  </div>
                  <div className="text-sm text-muted-foreground">6:00 AM</div>
                  <Switch defaultChecked data-testid="switch-morning-reminder" />
                </div>
              )}
              
              {eveningReminders.length > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-chart-5 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground">Evening Adhkar</div>
                    <div className="text-sm text-muted-foreground">Before Maghrib • Daily</div>
                  </div>
                  <div className="text-sm text-muted-foreground">7:00 PM</div>
                  <Switch defaultChecked data-testid="switch-evening-reminder" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adhkar Cards */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading adhkar...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adhkar?.map((adhkarItem: any) => (
                <AdhkarCard 
                  key={adhkarItem.id} 
                  adhkar={adhkarItem} 
                  showProgress={adhkarItem.repetitions > 1}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
