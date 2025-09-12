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
import { Plus, Clock, Settings, Check, Edit3, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TimeBlock {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  taskType: 'fard' | 'sunnah' | 'nafl' | 'wajib' | 'adhkar' | 'dua';
  category: string;
  completed: boolean;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
  arabicText?: string;
  transliteration?: string;
  translation?: string;
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
  dua: "bg-indigo-500 border-indigo-600 text-white"
};

// Sample Islamic tasks based on the PDF provided
const defaultIslamicTasks: TimeBlock[] = [
  {
    id: '1',
    title: 'Tahajjud (Night Prayer)',
    description: 'Wake for late-night nafl (voluntary) worship',
    startTime: '02:30',
    endTime: '03:00',
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
    taskType: 'sunnah',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '3',
    title: 'Fajr (Obligation)',
    description: '2 rak\'ahs fard. Must be offered before sunrise',
    startTime: '04:40',
    endTime: '05:00',
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '4',
    title: 'Morning Adhkar (after Fajr)',
    description: 'Engage in the prescribed post-Fajr remembrances',
    startTime: '05:00',
    endTime: '05:20',
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
    taskType: 'nafl',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '14',
    title: 'Duha (Forenoon) Prayer',
    description: 'Optional nafl in mid-morning. 2 or 4 rak\'ahs after sunrise',
    startTime: '06:30',
    endTime: '07:00',
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
    taskType: 'sunnah',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '7',
    title: 'Dhuhr (Obligatory)',
    description: '4 rak\'ahs fard',
    startTime: '12:28',
    endTime: '12:40',
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '8',
    title: 'Asr (Obligatory)',
    description: '4 rak\'ahs fard',
    startTime: '15:54',
    endTime: '16:15',
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '9',
    title: 'Maghrib (Obligatory)',
    description: '3 rak\'ahs fard at sunset',
    startTime: '18:48',
    endTime: '19:00',
    taskType: 'fard',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '10',
    title: 'Evening Adhkar (post-Maghrib)',
    description: 'Recite prescribed evening remembrances',
    startTime: '19:10',
    endTime: '19:20',
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
    title: 'Isha (Obligatory)',
    description: '4 rak\'ahs fard',
    startTime: '20:18',
    endTime: '20:30',
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
    taskType: 'wajib',
    category: 'prayer',
    completed: false,
    repeatType: 'daily'
  },
  {
    id: '13',
    title: 'Bedtime Duas & Adhkar',
    description: 'Before sleeping, perform recommended evening remembrances',
    startTime: '22:00',
    endTime: '22:20',
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
  const [tasks, setTasks] = useState<TimeBlock[]>(defaultIslamicTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TimeBlock | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const plannerRef = useRef<HTMLDivElement>(null);

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

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(task.id)}
        className={`absolute left-20 right-4 rounded-lg border-2 cursor-move hover:shadow-lg transition-all duration-200 ${
          taskTypeColors[task.taskType]
        } ${task.completed ? 'opacity-70' : ''}`}
        style={{
          top: `${startPos}%`,
          height: `${height}px`,
          minHeight: '60px'
        }}
        data-testid={`task-card-${task.id}`}
      >
        <div className="p-3 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">
                  {task.startTime} - {task.endTime}
                </span>
                <button
                  onClick={() => setEditingTask(task)}
                  className="text-white/80 hover:text-white transition-colors"
                  data-testid={`button-edit-${task.id}`}
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <h4 className="font-semibold text-sm text-white truncate">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-white/90 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.arabicText && (
                <p className="text-xs text-white/90 mt-1 font-arabic text-right">
                  {task.arabicText}
                </p>
              )}
              {task.transliteration && (
                <p className="text-xs text-white/80 mt-1 italic">
                  {task.transliteration}
                </p>
              )}
              {task.translation && (
                <p className="text-xs text-white/70 mt-1">
                  "{task.translation}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Badge 
                variant="secondary" 
                className="text-xs bg-white/20 text-white border-white/30"
              >
                {task.taskType}
              </Badge>
              <button
                onClick={() => {
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
            </div>
          </div>
          
          {task.repeatType && task.repeatType !== 'none' && (
            <div className="flex items-center gap-1 mt-2">
              <Calendar className="w-3 h-3 text-white/70" />
              <span className="text-xs text-white/70 capitalize">
                Repeats {task.repeatType}
              </span>
            </div>
          )}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground font-serif">Daily Islamic Planner</h2>
          <p className="text-muted-foreground">
            Structure your day around Islamic principles • {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
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
      <Card>
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

            {/* Task Cards */}
            {tasks
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
          </div>
        </CardContent>
      </Card>

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