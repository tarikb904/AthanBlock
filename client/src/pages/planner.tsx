import { Navigation } from "@/components/navigation";
import { TodayTimeline } from "@/components/today-timeline";
import { TaskBoard } from "@/components/task-board";
import { TimelineView } from "@/components/timeline-view";
import { HourRuler } from "@/components/hour-ruler";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentIslamicDate } from "@/lib/islamic-date";
import { LayoutGrid, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function Planner() {
  const islamicDate = getCurrentIslamicDate();
  const [selectedView, setSelectedView] = useState<'board' | 'timeline' | 'today'>('board');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  return (
    <>
      {/* Hour Ruler */}
      <HourRuler selectedDate={selectedDate} />
      
      <div className="min-h-screen bg-background ml-16">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground font-serif">Daily Islamic Planner</h1>
                <p className="text-muted-foreground">Structure your day around Islamic principles • {islamicDate}</p>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
                <Button
                  variant={selectedView === 'board' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedView('board')}
                  className="flex items-center space-x-2"
                  data-testid="button-board-view"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Board</span>
                </Button>
                <Button
                  variant={selectedView === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedView('timeline')}
                  className="flex items-center space-x-2"
                  data-testid="button-timeline-view"
                >
                  <Clock className="w-4 h-4" />
                  <span>Timeline</span>
                </Button>
                <Button
                  variant={selectedView === 'today' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedView('today')}
                  className="flex items-center space-x-2"
                  data-testid="button-today-view"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today</span>
                </Button>
              </div>
            </div>

            {/* Content based on selected view */}
            {selectedView === 'board' && <TaskBoard selectedDate={selectedDate} />}
            {selectedView === 'timeline' && <TimelineView selectedDate={selectedDate} />}
            {selectedView === 'today' && <TodayTimeline />}
          </div>
        </main>
      </div>
    </>
  );
}
