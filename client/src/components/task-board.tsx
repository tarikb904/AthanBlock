import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Calendar, Clock, CheckCircle2, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskCreationModal } from "@/components/task-creation-modal";

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: number;
  completed: boolean;
  assignedTo?: string[];
  dueDate?: string;
  estimatedMinutes?: number;
  taskType: 'fard' | 'sunnah' | 'nafl' | 'wajib' | 'adhkar' | 'dua';
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed';
  comments?: number;
}

interface TaskBoardProps {
  selectedDate: string;
}

const taskTypeColors = {
  fard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  sunnah: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
  nafl: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  wajib: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  adhkar: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  dua: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
};

const priorityColors = {
  1: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  2: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
  3: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
  4: "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200",
  5: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200"
};

const columns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-50 dark:bg-gray-900' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 dark:bg-blue-950' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-orange-50 dark:bg-orange-950' },
  { id: 'review', title: 'Review', color: 'bg-yellow-50 dark:bg-yellow-950' }
];

export function TaskBoard({ selectedDate }: TaskBoardProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const queryClient = useQueryClient();

  // Mock data - in real app would fetch from API
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Create wireframe foundation',
      description: 'Design the basic structure for the upcoming app',
      category: 'design',
      priority: 3,
      completed: false,
      taskType: 'fard',
      status: 'backlog',
      estimatedMinutes: 120,
      dueDate: '2025-09-08',
      assignedTo: ['user1'],
      comments: 2
    },
    {
      id: '2', 
      title: 'Morning Adhkar',
      description: 'Recite morning remembrance of Allah',
      category: 'worship',
      priority: 5,
      completed: false,
      taskType: 'adhkar',
      status: 'todo',
      estimatedMinutes: 15,
      assignedTo: ['user1']
    },
    {
      id: '3',
      title: 'Listing deliverable checklist',
      description: 'Create comprehensive list for project delivery',
      category: 'planning',
      priority: 2,
      completed: false,
      taskType: 'sunnah',
      status: 'in_progress',
      estimatedMinutes: 45,
      dueDate: '2025-09-08'
    },
    {
      id: '4',
      title: 'Design System',
      description: 'Create system for the upcoming App',
      category: 'design',
      priority: 4,
      completed: false,
      taskType: 'nafl',
      status: 'review',
      estimatedMinutes: 180,
      dueDate: '2025-09-10',
      assignedTo: ['user1', 'user2']
    }
  ];

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", selectedDate] });
    },
  });

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Task Type & Priority */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`text-xs ${taskTypeColors[task.taskType]} capitalize`}
            >
              {task.taskType}
            </Badge>
            <Badge 
              variant="outline"
              className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
            >
              Priority {task.priority}
            </Badge>
          </div>

          {/* Task Title */}
          <h4 className="font-medium text-sm text-foreground leading-tight">
            {task.title}
          </h4>

          {/* Task Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {task.estimatedMinutes < 60 
                  ? `${task.estimatedMinutes} min` 
                  : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`}
              </span>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              {task.assignedTo && (
                <div className="flex -space-x-2">
                  {task.assignedTo.slice(0, 3).map((user, index) => (
                    <Avatar key={user} className="w-6 h-6 border-2 border-background">
                      <AvatarFallback className="text-xs">
                        {String.fromCharCode(65 + index)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignedTo.length > 3 && (
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground border-2 border-background">
                      +{task.assignedTo.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              {task.comments && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-xs">{task.comments}</span>
                </div>
              )}
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const getTasksForColumn = (columnId: string) => {
    return mockTasks.filter(task => task.status === columnId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Task Board</h2>
          <p className="text-muted-foreground">
            Organize your Islamic tasks and daily activities
          </p>
        </div>
        <Button 
          onClick={() => setShowTaskModal(true)}
          className="bg-primary hover:bg-primary/90"
          data-testid="button-create-task"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Task
        </Button>
      </div>

      {/* Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {getTasksForColumn(column.id).length}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTaskModal(true)}
                data-testid={`button-add-${column.id}`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Column Content */}
            <div className={`min-h-[500px] p-4 rounded-lg ${column.color}`}>
              {getTasksForColumn(column.id).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              
              {getTasksForColumn(column.id).length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}