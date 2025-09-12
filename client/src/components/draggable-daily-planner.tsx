import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus, Clock, Settings, Check, Edit3, Calendar, X, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { TimeBlock } from "@shared/schema";

// Unified interface for UI time blocks that includes all needed properties
interface UITimeBlock {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  taskType: 'fard' | 'sunnah' | 'nafl' | 'wajib' | 'adhkar' | 'dua' | 'other';
  category: string;
  completed: boolean;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
  arabicText?: string;
  transliteration?: string;
  translation?: string;
  // Optional database fields
  userId?: string;
  date?: string | null;
  icon?: string | null;
  color?: string | null;
  isTemplate?: boolean | null;
  tasks?: unknown;
  createdAt?: Date | null;
}

interface DraggableDailyPlannerProps {
  selectedDate: string;
}

const taskTypeColors = {
  fard: "bg-red-500 border-red-600 text-white",
  sunnah: "bg-blue-500 border-blue-600 text-white",
  nafl: "bg-green-500 border-green-600 text-white",
  wajib: "bg-orange-500 border-orange-600 text-white",
  adhkar: "bg-purple-500 border-purple-600 text-white",
  dua: "bg-indigo-500 border-indigo-600 text-white",
  other: "bg-gray-500 border-gray-600 text-white"
};

// Helper function to calculate duration in minutes from start and end time
const calculateDurationFromTimes = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  const duration = (end.getTime() - start.getTime()) / (1000 * 60);
  return Math.max(15, duration); // Minimum 15 minutes
};

// Helper function to convert database TimeBlock to UITimeBlock
const dbToUITimeBlock = (dbBlock: TimeBlock): UITimeBlock => {
  const endTime = new Date();
  endTime.setHours(
    parseInt(dbBlock.startTime.split(':')[0]),
    parseInt(dbBlock.startTime.split(':')[1]) + dbBlock.duration,
    0, 0
  );
  
  return {
    id: dbBlock.id,
    title: dbBlock.title,
    description: dbBlock.description || '',
    startTime: dbBlock.startTime.slice(0, 5), // HH:MM format
    endTime: endTime.toTimeString().slice(0, 5),
    duration: dbBlock.duration,
    taskType: 'other',
    category: dbBlock.category,
    completed: dbBlock.completed || false,
    userId: dbBlock.userId,
    date: dbBlock.date,
    icon: dbBlock.icon,
    color: dbBlock.color,
    isTemplate: dbBlock.isTemplate,
    tasks: dbBlock.tasks,
    createdAt: dbBlock.createdAt
  };
};

// Helper function to convert UITimeBlock to database TimeBlock
const uiToDBTimeBlock = (uiBlock: UITimeBlock): Partial<TimeBlock> => {
  return {
    id: uiBlock.id,
    title: uiBlock.title,
    description: uiBlock.description,
    startTime: uiBlock.startTime + ':00', // HH:MM:SS format for database
    duration: uiBlock.duration,
    category: uiBlock.category,
    completed: uiBlock.completed,
    userId: uiBlock.userId,
    date: uiBlock.date,
    icon: uiBlock.icon,
    color: uiBlock.color,
    isTemplate: uiBlock.isTemplate,
    tasks: uiBlock.tasks
  };
};

const categoryColors: Record<string, string> = {
  'health': '#22C55E', // Green
  'family': '#F59E0B', // Amber
  'work': '#3B82F6', // Blue
  'personal': '#8B5CF6', // Purple
  'errands': '#F97316', // Orange
  'leisure': '#F43F5E', // Rose
  'other': '#6B7280', // Gray
  'prayer': '#3B82F6', // Blue for prayer
  'remembrance': '#8B5CF6', // Purple for remembrance
};

// Sample Islamic tasks based on the PDF provided
const defaultIslamicTasks: UITimeBlock[] = [
  {
    id: '1',
    title: 'Tahajjud Prayer',
    description: 'Wake for late-night nafl (voluntary) worship',
    startTime: '02:30',
    endTime: '03:00',
    duration: 30,
    taskType: 'nafl',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '2',
    title: 'Sunnah Fajr',
    description: '2 rak\'ahs sunnah muʾakkadah before Fajr',
    startTime: '04:15',
    endTime: '04:40',
    duration: 25,
    taskType: 'sunnah',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '3',
    title: 'Fajr Prayer',
    description: '2 rak\'ahs fard. Must be offered before sunrise',
    startTime: '04:40',
    endTime: '05:00',
    duration: 20,
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '4',
    title: 'Morning Adhkar',
    description: 'Engage in the prescribed post-Fajr remembrances',
    startTime: '05:00',
    endTime: '05:20',
    duration: 20,
    taskType: 'adhkar',
    category: 'remembrance',
    completed: false,
    repeatType: 'daily',
    arabicText: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
    transliteration: 'Allahumma bika asbahnā wa bika amsaynā',
    translation: 'O Allah, by Your leave we have reached the morning'
  },
  {
    id: '5',
    title: 'Ishraq Prayer',
    description: '2 rak\'ahs nafl (sunrise prayer) ~15–20 min after sunrise',
    startTime: '06:20',
    endTime: '06:30',
    duration: 10,
    taskType: 'nafl',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '14',
    title: 'Duha Prayer',
    description: 'Optional nafl in mid-morning. 2 or 4 rak\'ahs after sunrise',
    startTime: '06:30',
    endTime: '07:00',
    duration: 30,
    taskType: 'nafl',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '6',
    title: 'Pre-Dhuhr Sunnah',
    description: '4 rak\'ahs sunnah mu\'akkadah before Dhuhr',
    startTime: '11:45',
    endTime: '12:10',
    duration: 25,
    taskType: 'sunnah',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '7',
    title: 'Dhuhr Prayer',
    description: '4 rak\'ahs fard',
    startTime: '12:28',
    endTime: '12:40',
    duration: 12,
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '8',
    title: 'Asr Prayer',
    description: '4 rak\'ahs fard',
    startTime: '15:54',
    endTime: '16:15',
    duration: 21,
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '9',
    title: 'Maghrib Prayer',
    description: '3 rak\'ahs fard at sunset',
    startTime: '18:48',
    endTime: '19:00',
    duration: 12,
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '10',
    title: 'Evening Adhkar',
    description: 'Recite prescribed evening remembrances',
    startTime: '19:10',
    endTime: '19:20',
    duration: 10,
    taskType: 'adhkar',
    category: 'remembrance',
    completed: false,
    repeatType: 'daily',
    arabicText: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    transliteration: 'Amsaynā wa amsal-mulku lillāh',
    translation: 'We have reached the evening and unto Allah belongs all sovereignty'
  },
  {
    id: '11',
    title: 'Isha Prayer',
    description: '4 rak\'ahs fard',
    startTime: '20:18',
    endTime: '20:30',
    duration: 12,
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '12',
    title: 'Witr Prayer',
    description: '3 rak\'ahs odd (Witr, Witrul-Isha)',
    startTime: '20:40',
    endTime: '20:50',
    duration: 10,
    taskType: 'wajib',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '13',
    title: 'Bedtime Duas',
    description: 'Before sleeping, perform recommended evening remembrances',
    startTime: '22:00',
    endTime: '22:20',
    duration: 20,
    taskType: 'adhkar',
    category: 'remembrance',
    completed: false,
    repeatType: 'daily',
    arabicText: 'سُورَةُ الْمُلْكِ، آيَةُ الْكُرْسِيِّ',
    transliteration: 'Surah al-Mulk, Ayat al-Kursi',
    translation: 'Recite Surah Al-Mulk and Ayat Al-Kursi for protection'
  }
];

export function DraggableDailyPlanner({ selectedDate }: DraggableDailyPlannerProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<UITimeBlock[]>([]);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<UITimeBlock | null>(null);
  const [editingTask, setEditingTask] = useState<UITimeBlock | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const plannerRef = useRef<HTMLDivElement>(null);

  // Fetch prayer times from API
  const { data: prayerTimesData, isLoading: prayerTimesLoading } = useQuery({
    queryKey: ["/api/prayer-times", selectedDate],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Generate Islamic tasks based on prayer times
  const generateIslamicTasks = useCallback((prayerTimes: any): UITimeBlock[] => {
    if (!prayerTimes) return defaultIslamicTasks;

    const tasks: UITimeBlock[] = [];
    let taskId = 1;

    // Helper function to add minutes to time string
    const addMinutesToTime = (timeStr: string, minutes: number) => {
      const [hours, mins] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, mins + minutes, 0, 0);
      return date.toTimeString().slice(0, 5);
    };

    // Helper function to subtract minutes from time string  
    const subtractMinutesFromTime = (timeStr: string, minutes: number) => {
      const [hours, mins] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, mins - minutes, 0, 0);
      return date.toTimeString().slice(0, 5);
    };

    // Tahajjud (pre-dawn)
    tasks.push({
      id: (taskId++).toString(),
      title: 'Tahajjud Prayer',
      description: 'Wake for late-night nafl (voluntary) worship',
      startTime: '02:30',
      endTime: '03:00',
      duration: 30,
      taskType: 'nafl',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Pre-Fajr Sunnah
    const preFajrTime = subtractMinutesFromTime(prayerTimes.fajr, 25);
    const fajrSunnahEnd = subtractMinutesFromTime(prayerTimes.fajr, 5);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Sunnah Fajr',
      description: '2 rak\'ahs sunnah muʾakkadah before Fajr',
      startTime: preFajrTime,
      endTime: fajrSunnahEnd,
      duration: calculateDurationFromTimes(preFajrTime, fajrSunnahEnd),
      taskType: 'sunnah',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Fajr Prayer (Fard)
    const fajrEndTime = addMinutesToTime(prayerTimes.fajr, 20);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Fajr Prayer',
      description: '2 rak\'ahs fard. Must be offered before sunrise',
      startTime: prayerTimes.fajr,
      endTime: fajrEndTime,
      duration: 20,
      taskType: 'fard',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Morning Adhkar
    tasks.push({
      id: (taskId++).toString(),
      title: 'Morning Adhkar',
      description: 'Engage in the prescribed post-Fajr remembrances',
      startTime: fajrEndTime,
      endTime: addMinutesToTime(fajrEndTime, 20),
      duration: 20,
      taskType: 'adhkar',
      category: 'remembrance',
      completed: false,
      repeatType: 'daily',
      arabicText: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا',
      transliteration: 'Allahumma bika asbahnā wa bika amsaynā',
      translation: 'O Allah, by Your leave we have reached the morning'
    });

    // Ishraq Prayer (10 minutes after sunrise)
    const ishraqTime = addMinutesToTime(prayerTimes.sunrise, 10);
    const ishraqEndTime = addMinutesToTime(ishraqTime, 10);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Ishraq Prayer',
      description: '2 rak\'ahs nafl (sunrise prayer) ~10 min after sunrise',
      startTime: ishraqTime,
      endTime: ishraqEndTime,
      duration: 10,
      taskType: 'nafl',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Duha Prayer
    const duhaTime = addMinutesToTime(prayerTimes.sunrise, 30);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Duha Prayer',
      description: 'Optional nafl in mid-morning. 2 or 4 rak\'ahs after sunrise',
      startTime: duhaTime,
      endTime: addMinutesToTime(duhaTime, 30),
      duration: 30,
      taskType: 'nafl',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Pre-Dhuhr Sunnah
    const preDhuhrTime = subtractMinutesFromTime(prayerTimes.dhuhr, 25);
    const dhuhrSunnahEnd = subtractMinutesFromTime(prayerTimes.dhuhr, 5);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Pre-Dhuhr Sunnah',
      description: '4 rak\'ahs sunnah mu\'akkadah before Dhuhr',
      startTime: preDhuhrTime,
      endTime: dhuhrSunnahEnd,
      duration: calculateDurationFromTimes(preDhuhrTime, dhuhrSunnahEnd),
      taskType: 'sunnah',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Dhuhr Prayer (Fard)
    const dhuhrEndTime = addMinutesToTime(prayerTimes.dhuhr, 15);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Dhuhr Prayer',
      description: '4 rak\'ahs fard',
      startTime: prayerTimes.dhuhr,
      endTime: dhuhrEndTime,
      duration: 15,
      taskType: 'fard',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Post-Dhuhr Sunnah
    tasks.push({
      id: (taskId++).toString(),
      title: 'Post-Dhuhr Sunnah',
      description: '2 rak\'ahs sunnah mu\'akkadah after Dhuhr',
      startTime: dhuhrEndTime,
      endTime: addMinutesToTime(dhuhrEndTime, 15),
      duration: 15,
      taskType: 'sunnah',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Asr Prayer (Fard)
    const asrEndTime = addMinutesToTime(prayerTimes.asr, 20);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Asr Prayer',
      description: '4 rak\'ahs fard',
      startTime: prayerTimes.asr,
      endTime: asrEndTime,
      duration: 20,
      taskType: 'fard',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Maghrib Prayer (Fard)
    const maghribEndTime = addMinutesToTime(prayerTimes.maghrib, 15);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Maghrib Prayer',
      description: '3 rak\'ahs fard at sunset',
      startTime: prayerTimes.maghrib,
      endTime: maghribEndTime,
      duration: 15,
      taskType: 'fard',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Post-Maghrib Sunnah
    tasks.push({
      id: (taskId++).toString(),
      title: 'Post-Maghrib Sunnah',
      description: '2 rak\'ahs sunnah mu\'akkadah after Maghrib',
      startTime: maghribEndTime,
      endTime: addMinutesToTime(maghribEndTime, 15),
      duration: 15,
      taskType: 'sunnah',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Evening Adhkar
    const eveningAdhkarStart = addMinutesToTime(maghribEndTime, 15);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Evening Adhkar',
      description: 'Recite prescribed evening remembrances',
      startTime: eveningAdhkarStart,
      endTime: addMinutesToTime(eveningAdhkarStart, 15),
      duration: 15,
      taskType: 'adhkar',
      category: 'remembrance',
      completed: false,
      repeatType: 'daily',
      arabicText: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
      transliteration: 'Amsaynā wa amsal-mulku lillāh',
      translation: 'We have reached the evening and unto Allah belongs all sovereignty'
    });

    // Isha Prayer (Fard)
    const ishaEndTime = addMinutesToTime(prayerTimes.isha, 15);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Isha Prayer',
      description: '4 rak\'ahs fard',
      startTime: prayerTimes.isha,
      endTime: ishaEndTime,
      duration: 15,
      taskType: 'fard',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Post-Isha Sunnah
    tasks.push({
      id: (taskId++).toString(),
      title: 'Post-Isha Sunnah',
      description: '2 rak\'ahs sunnah mu\'akkadah after Isha',
      startTime: ishaEndTime,
      endTime: addMinutesToTime(ishaEndTime, 15),
      duration: 15,
      taskType: 'sunnah',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Witr Prayer
    const witrTime = addMinutesToTime(ishaEndTime, 15);
    tasks.push({
      id: (taskId++).toString(),
      title: 'Witr Prayer',
      description: '3 rak\'ahs odd (Witr, Witrul-Isha)',
      startTime: witrTime,
      endTime: addMinutesToTime(witrTime, 15),
      duration: 15,
      taskType: 'wajib',
      category: 'prayer',
      completed: false,
      repeatType: 'daily'
    });

    // Bedtime Duas
    tasks.push({
      id: (taskId++).toString(),
      title: 'Bedtime Duas',
      description: 'Before sleeping, perform recommended evening remembrances',
      startTime: '22:00',
      endTime: '22:20',
      duration: 20,
      taskType: 'adhkar',
      category: 'remembrance',
      completed: false,
      repeatType: 'daily',
      arabicText: 'سُورَةُ الْمُلْكِ، آيَةُ الْكُرْسِيِّ',
      transliteration: 'Surah al-Mulk, Ayat al-Kursi',
      translation: 'Recite Surah Al-Mulk and Ayat Al-Kursi for protection'
    });

    return tasks;
  }, []);

  // Update tasks when prayer times are fetched
  useEffect(() => {
    if (prayerTimesData && !prayerTimesLoading) {
      const generatedTasks = generateIslamicTasks(prayerTimesData);
      setTasks(generatedTasks);
    } else if (!prayerTimesData && !prayerTimesLoading) {
      // Fallback to default tasks if no prayer times available
      setTasks(defaultIslamicTasks);
    }
  }, [prayerTimesData, prayerTimesLoading, generateIslamicTasks]);

  // Generate 24 hour markers
  const hours = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  // Calculate task position and height based on time
  const timeToPosition = useCallback((time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  }, []);

  const calculateDuration = useCallback((startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(15, duration); // Minimum 15 minutes
  }, []);

  const positionToTime = useCallback((position: number) => {
    const totalMinutes = Math.round((position / 100) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  // Handle drag and drop
  const handleDragStart = useCallback((taskId: string) => {
    setDraggedTask(taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask || !plannerRef.current) return;

    const rect = plannerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const timelineHeight = rect.height;
    const position = (y / timelineHeight) * 100;

    const newStartTime = positionToTime(position);

    setTasks(prev => prev.map(task => {
      if (task.id === draggedTask) {
        const duration = calculateDuration(task.startTime, task.endTime);
        const startMinutes = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
        let endMinutes = startMinutes + duration;

        // Clamp to prevent going past 23:59
        if (endMinutes >= 24 * 60) {
          endMinutes = 23 * 60 + 59; // Set to 23:59
          const newStartMinutes = Math.max(0, endMinutes - duration);
          const startHours = Math.floor(newStartMinutes / 60);
          const startMins = newStartMinutes % 60;
          const clampedStartTime = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;

          return {
            ...task,
            startTime: clampedStartTime,
            endTime: '23:59'
          };
        }

        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        return {
          ...task,
          startTime: newStartTime,
          endTime: newEndTime
        };
      }
      return task;
    }));

    setDraggedTask(null);
  }, [draggedTask, positionToTime, calculateDuration]);

  const TaskCard = ({ task }: { task: TimeBlock }) => {
    const startPos = timeToPosition(task.startTime);
    const duration = calculateDuration(task.startTime, task.endTime);
    const height = Math.max(60, (duration / 60) * 60); // 60px per hour minimum
    const isSelected = selectedTask?.id === task.id;

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(task.id)}
        onClick={() => setSelectedTask(task)}
        className={`absolute left-20 rounded-lg border cursor-pointer hover:shadow-lg transition-all duration-200 ${
          isSelected 
            ? `${taskTypeColors[task.taskType]} ring-4 ring-white/50 shadow-2xl z-50 scale-105` 
            : `${taskTypeColors[task.taskType]} ${task.completed ? 'opacity-70' : ''} z-10`
        }`}
        style={{
          top: `${startPos}%`,
          height: `${height}px`,
          minHeight: '60px',
          right: selectedTask ? '25rem' : '1rem', // Leave more space for details panel when selected
        }}
        data-testid={`task-card-${task.id}`}
      >
        <div className="p-3 h-full flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                {task.startTime} - {task.endTime}
              </span>
            </div>
            <h4 className="font-semibold text-sm text-white truncate">
              {task.title}
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge 
              variant="secondary" 
              className="text-xs bg-white/20 text-white border-white/30"
            >
              {task.taskType}
            </Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTasks(prev => prev.map(t => 
                  t.id === task.id ? { ...t, completed: !t.completed } : t
                ));
              }}
              className={`w-5 h-5 rounded border-2 border-white/50 flex items-center justify-center ${
                task.completed ? 'bg-white/30' : 'hover:bg-white/20'
              } transition-colors`}
              data-testid={`checkbox-${task.id}`}
            >
              {task.completed && <Check className="w-3 h-3 text-white" />}
            </button>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </div>
        </div>
      </div>
    );
  };

  const TaskDetailsPanel = ({ task }: { task: TimeBlock }) => {
    return (
      <div 
        className="fixed right-4 top-20 w-80 bg-card border border-border rounded-lg shadow-xl z-40 flex flex-col"
        style={{
          height: '80vh', // Consistent height for all tasks
          maxHeight: 'calc(100vh - 6rem)', // Ensure it doesn't go off screen
        }}
      >
        {/* Fixed Header */}
        <div className="p-4 border-b bg-muted/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold truncate">{task.title}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingTask(task)}
                data-testid={`button-edit-${task.id}`}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTask(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Badge className={taskTypeColors[task.taskType].replace('text-white', 'text-white/90')}>
            {task.taskType.toUpperCase()}
          </Badge>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Time</Label>
              <p className="text-sm font-mono">{task.startTime} - {task.endTime}</p>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Category</Label>
              <Badge 
                variant="secondary" 
                className="text-white border-none"
                style={{ 
                  backgroundColor: categoryColors[task.category] || categoryColors.other
                }}
              >
                {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
              </Badge>
            </div>

            {/* Task Type */}
            {task.taskType && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">Task Type</Label>
                <Badge variant="outline">
                  {task.taskType}
                </Badge>
              </div>
            )}

            {task.repeatType && task.repeatType !== 'none' && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Repeat</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{task.repeatType}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => {
                    setTasks(prev => prev.map(t => 
                      t.id === task.id ? { ...t, completed: !t.completed } : t
                    ));
                    setSelectedTask(prev => prev ? { ...prev, completed: !prev.completed } : null);
                  }}
                  className={`w-5 h-5 rounded border-2 border-border flex items-center justify-center ${
                    task.completed ? 'bg-primary' : 'hover:bg-muted'
                  } transition-colors`}
                >
                  {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <span className="text-sm">{task.completed ? 'Completed' : 'Pending'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            <div className="text-sm mt-1 leading-relaxed min-h-[3rem] flex items-start">
              <p className="w-full">{task.description || 'No description available'}</p>
            </div>
          </div>

          {/* Islamic Content */}
          {(task.arabicText || task.transliteration || task.translation) && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-sm font-medium text-muted-foreground">Islamic Content</Label>

                {task.arabicText && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <Label className="text-xs font-medium text-muted-foreground">Arabic</Label>
                    <p className="text-lg text-right mt-1" dir="rtl" style={{ fontFamily: 'Arabic UI, Geeza Pro, Arabic Typesetting, serif' }}>
                      {task.arabicText}
                    </p>
                  </div>
                )}

                {task.transliteration && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Transliteration</Label>
                    <p className="text-sm italic mt-1">{task.transliteration}</p>
                  </div>
                )}

                {task.translation && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Translation</Label>
                    <p className="text-sm mt-1">"{task.translation}"</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Additional spacing at bottom for scrolling */}
          <div className="h-4"></div>
        </div>
      </div>
    );
  };

  const NewTaskForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      taskType: 'sunnah' as TimeBlock['taskType'],
      category: 'personal',
      repeatType: 'none' as TimeBlock['repeatType'],
      arabicText: '',
      transliteration: '',
      translation: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newTask: TimeBlock = {
        id: Date.now().toString(),
        ...formData,
        completed: false
      };
      setTasks(prev => [...prev, newTask]);
      setShowAddTask(false);
      setFormData({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        taskType: 'sunnah',
        category: 'personal',
        repeatType: 'none',
        arabicText: '',
        transliteration: '',
        translation: ''
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Morning Adhkar"
              required
            />
          </div>
          <div>
            <Label htmlFor="taskType">Task Type</Label>
            <Select value={formData.taskType} onValueChange={(value) => 
              setFormData({ ...formData, taskType: value as TimeBlock['taskType'] })
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fard">Fard (Obligatory)</SelectItem>
                <SelectItem value="wajib">Wajib (Necessary)</SelectItem>
                <SelectItem value="sunnah">Sunnah (Recommended)</SelectItem>
                <SelectItem value="nafl">Nafl (Optional)</SelectItem>
                <SelectItem value="adhkar">Adhkar (Remembrance)</SelectItem>
                <SelectItem value="dua">Dua (Supplication)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Task description..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="repeatType">Repeat</Label>
            <Select value={formData.repeatType} onValueChange={(value) => 
              setFormData({ ...formData, repeatType: value as TimeBlock['repeatType'] })
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) =>
            setFormData({ ...formData, category: value })
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="health">Health & Well-Being</SelectItem>
              <SelectItem value="family">Family & Relationships</SelectItem>
              <SelectItem value="work">Work & Study</SelectItem>
              <SelectItem value="personal">Personal Growth</SelectItem>
              <SelectItem value="errands">Errands & Household</SelectItem>
              <SelectItem value="leisure">Rest & Leisure</SelectItem>
              <SelectItem value="other">Other / Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="arabicText">Arabic Text (Optional)</Label>
          <Input
            id="arabicText"
            value={formData.arabicText}
            onChange={(e) => setFormData({ ...formData, arabicText: e.target.value })}
            placeholder="Arabic text for adhkar/dua"
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transliteration">Transliteration</Label>
            <Input
              id="transliteration"
              value={formData.transliteration}
              onChange={(e) => setFormData({ ...formData, transliteration: e.target.value })}
              placeholder="Phonetic pronunciation"
            />
          </div>
          <div>
            <Label htmlFor="translation">Translation</Label>
            <Input
              id="translation"
              value={formData.translation}
              onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
              placeholder="English meaning"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setShowAddTask(false)}>
            Cancel
          </Button>
          <Button type="submit">Add Task</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="flex h-screen relative">
      {/* Main Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground font-serif">Daily Islamic Planner</h2>
            <p className="text-muted-foreground">
              Structure your day around Islamic principles • {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              {prayerTimesLoading && " • Loading prayer times..."}
              {prayerTimesData && " • Prayer times integrated"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddTask(true)}
              data-testid="button-add-task"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Task
            </Button>
          </div>
        </div>

        {/* Daily Planner */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Schedule
              <Badge variant="secondary" className="ml-auto">
                {tasks.length} tasks
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={plannerRef}
              className="relative"
              style={{ height: '1440px' }} // 24 hours * 60px per hour
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Timeline Hours */}
              <div className="absolute left-0 top-0 w-16 h-full">
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute flex items-center text-sm text-muted-foreground font-mono"
                    style={{ top: `${(index / 24) * 100}%`, height: '60px' }}
                  >
                    <span className="w-12 text-right">{hour}</span>
                  </div>
                ))}
              </div>

              {/* Hour Lines */}
              {hours.map((hour, index) => (
                <div
                  key={`line-${hour}`}
                  className="absolute left-16 right-0 border-t border-border/30"
                  style={{ top: `${(index / 24) * 100}%` }}
                />
              ))}

              {/* Task Cards - Sort to bring selected task to front */}
              {tasks
                .sort((a, b) => {
                  // Selected task comes first (highest z-index via CSS)
                  if (selectedTask?.id === a.id) return 1;
                  if (selectedTask?.id === b.id) return -1;
                  return a.startTime.localeCompare(b.startTime);
                })
                .map(task => {
                  const isSelected = selectedTask?.id === task.id;
                  return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => setSelectedTask(task)}
                    className={`absolute left-20 rounded-lg border cursor-pointer hover:shadow-lg transition-all duration-200 ${
                      isSelected 
                        ? `${taskTypeColors[task.taskType]} ring-4 ring-white/50 shadow-2xl z-50 scale-105` 
                        : `${taskTypeColors[task.taskType]} ${task.completed ? 'opacity-70' : ''} z-10`
                    }`}
                    style={{
                      top: `${timeToPosition(task.startTime)}%`,
                      height: `${Math.max(60, (calculateDuration(task.startTime, task.endTime) / 60) * 60)}px`,
                      minHeight: '60px',
                      right: selectedTask ? '25rem' : '1rem', // Leave more space for details panel when selected
                    }}
                    data-testid={`task-card-${task.id}`}
                  >
                    <div className="p-3 h-full flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                            {task.startTime} - {task.endTime}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-white truncate">
                          {task.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-white/20 text-white border-white/30"
                        >
                          {task.taskType}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTasks(prev => prev.map(t => 
                              t.id === task.id ? { ...t, completed: !t.completed } : t
                            ));
                          }}
                          className={`w-5 h-5 rounded border-2 border-white/50 flex items-center justify-center ${
                            task.completed ? 'bg-white/30' : 'hover:bg-white/20'
                          } transition-colors`}
                          data-testid={`checkbox-${task.id}`}
                        >
                          {task.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      </div>
                    </div>
                  </div>
                  );
                })}

              {/* Floating Task Details Panel */}
              {selectedTask && <TaskDetailsPanel task={selectedTask} />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Islamic Task</DialogTitle>
          </DialogHeader>
          <NewTaskForm />
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task Title</Label>
                  <Input
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Task Type</Label>
                  <Select 
                    value={editingTask.taskType} 
                    onValueChange={(value) => setEditingTask({...editingTask, taskType: value as TimeBlock['taskType']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fard">Fard (Obligatory)</SelectItem>
                      <SelectItem value="wajib">Wajib (Necessary)</SelectItem>
                      <SelectItem value="sunnah">Sunnah (Recommended)</SelectItem>
                      <SelectItem value="nafl">Nafl (Optional)</SelectItem>
                      <SelectItem value="adhkar">Adhkar (Remembrance)</SelectItem>
                      <SelectItem value="dua">Dua (Supplication)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  placeholder="Task description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={editingTask.startTime}
                    onChange={(e) => setEditingTask({...editingTask, startTime: e.target.value})}
                    data-testid="input-edit-start-time"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={editingTask.endTime}
                    onChange={(e) => setEditingTask({...editingTask, endTime: e.target.value})}
                    data-testid="input-edit-end-time"
                  />
                </div>
                <div>
                  <Label>Repeat</Label>
                  <Select 
                    value={editingTask.repeatType || 'none'} 
                    onValueChange={(value) => setEditingTask({...editingTask, repeatType: value as TimeBlock['repeatType']})}
                  >
                    <SelectTrigger data-testid="select-edit-repeat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Category</Label>
                <Select 
                  value={editingTask.category} 
                  onValueChange={(value) => setEditingTask({...editingTask, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health & Well-Being</SelectItem>
                    <SelectItem value="family">Family & Relationships</SelectItem>
                    <SelectItem value="work">Work & Study</SelectItem>
                    <SelectItem value="personal">Personal Growth</SelectItem>
                    <SelectItem value="errands">Errands & Household</SelectItem>
                    <SelectItem value="leisure">Rest & Leisure</SelectItem>
                    <SelectItem value="other">Other / Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Arabic Text (Optional)</Label>
                <Input
                  value={editingTask.arabicText || ''}
                  onChange={(e) => setEditingTask({...editingTask, arabicText: e.target.value})}
                  placeholder="Arabic text for adhkar/dua"
                  dir="rtl"
                  data-testid="input-edit-arabic-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transliteration</Label>
                  <Input
                    value={editingTask.transliteration || ''}
                    onChange={(e) => setEditingTask({...editingTask, transliteration: e.target.value})}
                    placeholder="Phonetic pronunciation"
                    data-testid="input-edit-transliteration"
                  />
                </div>
                <div>
                  <Label>Translation</Label>
                  <Input
                    value={editingTask.translation || ''}
                    onChange={(e) => setEditingTask({...editingTask, translation: e.target.value})}
                    placeholder="English meaning"
                    data-testid="input-edit-translation"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setTasks(prev => prev.filter(t => t.id !== editingTask.id));
                    setEditingTask(null);
                    if (selectedTask?.id === editingTask.id) {
                      setSelectedTask(null);
                    }
                  }}
                >
                  Delete Task
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingTask(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
                    if (selectedTask?.id === editingTask.id) {
                      setSelectedTask(editingTask);
                    }
                    setEditingTask(null);
                  }}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}