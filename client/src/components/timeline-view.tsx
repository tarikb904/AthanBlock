import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, addMinutes } from "date-fns";
import { Clock, Plus, Calendar } from "lucide-react";
import { useState } from "react";

interface TimelineTask {
  id: string;
  title: string;
  startTime: string;
  duration: number;
  taskType: 'fard' | 'sunnah' | 'nafl' | 'wajib' | 'adhkar' | 'dua';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed';
  assignedTo?: string[];
  category: string;
  progress?: number;
}

interface Prayer {
  id: string;
  name: string;
  time: string;
  completed: boolean;
  taskType: 'fard';
}

interface TimelineViewProps {
  selectedDate: string;
}

const taskTypeColors = {
  fard: "#ef4444", // red
  sunnah: "#3b82f6", // blue  
  nafl: "#22c55e", // green
  wajib: "#f97316", // orange
  adhkar: "#a855f7", // purple
  dua: "#6366f1" // indigo
};

// Mock data
const mockTimelineTasks: TimelineTask[] = [
  {
    id: '1',
    title: 'UI Research',
    startTime: '09:00',
    duration: 120,
    taskType: 'adhkar',
    status: 'completed',
    assignedTo: ['user1', 'user2'],
    category: 'research',
    progress: 100
  },
  {
    id: '2',
    title: 'Information Architecture',
    startTime: '10:30',
    duration: 90,
    taskType: 'sunnah',
    status: 'in_progress',
    assignedTo: ['user1'],
    category: 'design',
    progress: 44
  },
  {
    id: '3',
    title: 'Design Phase',
    startTime: '13:00',
    duration: 180,
    taskType: 'nafl',
    status: 'todo',
    assignedTo: ['user2', 'user3'],
    category: 'design',
    progress: 0
  },
  {
    id: '4',
    title: 'Build Wireframe',
    startTime: '14:30',
    duration: 90,
    taskType: 'wajib',
    status: 'review',
    assignedTo: ['user1'],
    category: 'development',
    progress: 85
  },
  {
    id: '5',
    title: 'Development',
    startTime: '16:00',
    duration: 240,
    taskType: 'fard',
    status: 'in_progress',
    assignedTo: ['user2', 'user3', 'user4'],
    category: 'development',
    progress: 65
  }
];

const mockPrayers: Prayer[] = [
  { id: '1', name: 'Fajr', time: '05:30', completed: true, taskType: 'fard' },
  { id: '2', name: 'Dhuhr', time: '12:30', completed: false, taskType: 'fard' },
  { id: '3', name: 'Asr', time: '15:45', completed: false, taskType: 'fard' },
  { id: '4', name: 'Maghrib', time: '18:20', completed: false, taskType: 'fard' },
  { id: '5', name: 'Isha', time: '19:45', completed: false, taskType: 'fard' },
];

export function TimelineView({ selectedDate }: TimelineViewProps) {
  const [selectedView, setSelectedView] = useState<'today' | 'week' | 'month'>('today');

  // Generate hour markers (24 hours)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper function to convert time to position
  const timeToPosition = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  };

  // Helper function to convert duration to width
  const durationToWidth = (duration: number) => {
    return (duration / (24 * 60)) * 100;
  };

  const TaskBlock = ({ task }: { task: TimelineTask }) => {
    const startPosition = timeToPosition(task.startTime);
    const width = durationToWidth(task.duration);
    
    return (
      <div
        className="absolute h-12 rounded-lg flex items-center px-3 cursor-pointer hover:shadow-lg transition-shadow"
        style={{
          left: `${startPosition}%`,
          width: `${width}%`,
          backgroundColor: taskTypeColors[task.taskType],
          color: 'white'
        }}
        data-testid={`timeline-task-${task.id}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="font-medium text-sm truncate">{task.title}</span>
            {task.progress !== undefined && (
              <span className="text-xs opacity-90">{task.progress}%</span>
            )}
          </div>
          
          {task.assignedTo && (
            <div className="flex -space-x-1">
              {task.assignedTo.slice(0, 3).map((user, index) => (
                <Avatar key={user} className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs bg-white/20 text-white">
                    {String.fromCharCode(65 + index)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const PrayerMarker = ({ prayer }: { prayer: Prayer }) => {
    const position = timeToPosition(prayer.time);
    
    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
          <div className={`w-3 h-3 rounded-full border-2 border-white ${
            prayer.completed ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
            {prayer.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground">Timeline</h2>
          
          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((view) => (
              <Button
                key={view}
                variant={selectedView === view ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView(view)}
                className="text-xs capitalize"
                data-testid={`button-view-${view}`}
              >
                {view}
              </Button>
            ))}
          </div>

          {/* Date Display */}
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(selectedDate), 'MMM d, yyyy')}</span>
          </div>
        </div>

        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          {/* Hour Labels */}
          <div className="relative mb-6">
            <div className="flex justify-between text-xs text-muted-foreground">
              {hours.filter((_, i) => i % 2 === 0).map(hour => (
                <span key={hour} className="w-8 text-center">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              ))}
            </div>
          </div>

          {/* Projects and Tasks */}
          <div className="space-y-6">
            {/* Projects */}
            {[
              { name: 'UI Research', tasks: mockTimelineTasks.filter(t => t.category === 'research') },
              { name: 'Information Architecture', tasks: mockTimelineTasks.filter(t => t.category === 'design') },
              { name: 'Design Phase', tasks: mockTimelineTasks.filter(t => t.category === 'design') },
              { name: 'Development', tasks: mockTimelineTasks.filter(t => t.category === 'development') }
            ].map((project, index) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="font-medium text-sm">{project.name}</span>
                  <div className="flex items-center space-x-1">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {String.fromCharCode(65 + index)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Task Timeline */}
                <div className="relative h-16 bg-muted/30 rounded-lg">
                  {/* Prayer markers */}
                  {mockPrayers.map(prayer => (
                    <PrayerMarker key={prayer.id} prayer={prayer} />
                  ))}
                  
                  {/* Tasks */}
                  {project.tasks.map(task => (
                    <TaskBlock key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-xs text-muted-foreground">Fard (Obligatory)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-xs text-muted-foreground">Sunnah (Recommended)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-xs text-muted-foreground">Nafl (Optional)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span className="text-xs text-muted-foreground">Adhkar</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Prayer Times</span>
                <div className="w-0.5 h-4 bg-red-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}