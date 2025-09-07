import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Calendar,
  Plus,
  Moon,
  Sun,
  Sunrise,
  Sunset
} from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";

interface Prayer {
  id: string;
  prayerName: string;
  prayerTime: string;
  completed: boolean;
  date: string;
}

interface TimeBlock {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  category: string;
  date: string;
}

interface TodayTimelineProps {
  selectedDate?: string;
}

const prayerIcons = {
  fajr: Sunrise,
  dhuhr: Sun,
  asr: Sun,
  maghrib: Sunset,
  isha: Moon,
} as const;

const categoryColors = {
  worship: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  study: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  work: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  personal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  family: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
} as const;

export function TodayTimeline({ selectedDate }: TodayTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const today = selectedDate || format(new Date(), 'yyyy-MM-dd');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch prayers for today
  const { data: prayers = [], isLoading: prayersLoading } = useQuery({
    queryKey: ['/api/prayers', today],
    queryFn: async () => {
      const response = await fetch(`/api/prayers?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch prayers');
      return response.json();
    },
  });

  // Fetch time blocks for today
  const { data: timeBlocks = [], isLoading: blocksLoading } = useQuery({
    queryKey: ['/api/time-blocks', today],
    queryFn: async () => {
      const response = await fetch(`/api/time-blocks?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch time blocks');
      return response.json();
    },
  });

  // Toggle prayer completion
  const togglePrayerMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return apiRequest('PATCH', `/api/prayers/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayers', today] });
      toast({
        title: "Prayer updated",
        description: "Prayer status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update prayer status.",
        variant: "destructive",
      });
    },
  });

  // Toggle time block completion
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return apiRequest('PATCH', `/api/time-blocks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-blocks', today] });
      toast({
        title: "Task updated",
        description: "Task status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  // Combine and sort all timeline items
  const timelineItems = [
    ...prayers.map((prayer: Prayer) => ({
      id: prayer.id,
      type: 'prayer' as const,
      time: prayer.prayerTime,
      title: prayer.prayerName,
      completed: prayer.completed,
      data: prayer,
    })),
    ...timeBlocks.map((block: TimeBlock) => ({
      id: block.id,
      type: 'block' as const,
      time: block.startTime,
      title: block.title,
      completed: block.completed,
      data: block,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const isCurrentTime = (time: string) => {
    const itemTime = parseISO(`${today}T${time}`);
    const now = new Date();
    const timeAfter = new Date(itemTime.getTime() + 30 * 60000); // 30 minutes after
    
    return isAfter(now, itemTime) && isBefore(now, timeAfter);
  };

  const isPastTime = (time: string) => {
    const itemTime = parseISO(`${today}T${time}`);
    const now = new Date();
    return isAfter(now, itemTime);
  };

  if (prayersLoading || blocksLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Today's Timeline</h2>
          <p className="text-muted-foreground flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(today), 'EEEE, MMMM d, yyyy')}</span>
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
          data-testid="button-add-block"
        >
          <Plus className="w-4 h-4" />
          <span>Add Block</span>
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          {timelineItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items scheduled for today</p>
              <p className="text-sm">Add some time blocks to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timelineItems.map((item, index) => {
                const isNow = isCurrentTime(item.time);
                const isPast = isPastTime(item.time);
                
                return (
                  <div
                    key={item.id}
                    className={`relative flex items-start space-x-4 p-4 rounded-lg transition-all ${
                      isNow 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'hover:bg-muted/50'
                    } ${isPast ? 'opacity-75' : ''}`}
                    data-testid={`timeline-item-${item.type}-${item.id}`}
                  >
                    {/* Time indicator */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        item.completed 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : isNow 
                            ? 'bg-primary/20' 
                            : 'bg-muted'
                      }`}>
                        {item.type === 'prayer' ? (
                          React.createElement(prayerIcons[item.data.prayerName.toLowerCase() as keyof typeof prayerIcons] || Clock, {
                            className: `w-6 h-6 ${item.completed ? 'text-green-600' : isNow ? 'text-primary' : 'text-muted-foreground'}`
                          })
                        ) : (
                          <Clock className={`w-6 h-6 ${item.completed ? 'text-green-600' : isNow ? 'text-primary' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      
                      <span className={`text-sm font-medium ${isNow ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(parseISO(`2024-01-01T${item.time}`), 'h:mm a')}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={(checked) => {
                            if (item.type === 'prayer') {
                              togglePrayerMutation.mutate({ id: item.id, completed: checked as boolean });
                            } else {
                              toggleBlockMutation.mutate({ id: item.id, completed: checked as boolean });
                            }
                          }}
                          data-testid={`checkbox-${item.type}-${item.id}`}
                        />
                        
                        <div className="flex-1">
                          <h3 className={`font-semibold ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.title}
                          </h3>
                          
                          {item.type === 'prayer' ? (
                            <p className="text-sm text-muted-foreground capitalize">
                              {item.data.prayerName} Prayer
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {item.data.description && (
                                <p className="text-sm text-muted-foreground">
                                  {item.data.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant="secondary" 
                                  className={categoryColors[item.data.category as keyof typeof categoryColors] || categoryColors.default}
                                >
                                  {item.data.category}
                                </Badge>
                                {item.data.endTime && (
                                  <span className="text-xs text-muted-foreground">
                                    until {format(parseISO(`2024-01-01T${item.data.endTime}`), 'h:mm a')}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Current time indicator */}
                    {isNow && (
                      <div className="absolute -left-2 top-4">
                        <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}

                    {/* Timeline line */}
                    {index < timelineItems.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-8 bg-border" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {prayers.filter((p: Prayer) => p.completed).length}/{prayers.length}
            </div>
            <div className="text-sm text-muted-foreground">Prayers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {timeBlocks.filter((b: TimeBlock) => b.completed).length}/{timeBlocks.length}
            </div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {Math.round(((prayers.filter((p: Prayer) => p.completed).length + timeBlocks.filter((b: TimeBlock) => b.completed).length) / (prayers.length + timeBlocks.length)) * 100) || 0}%
            </div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {format(currentTime, 'h:mm a')}
            </div>
            <div className="text-sm text-muted-foreground">Current</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}