import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

const categories = [
  {
    id: 'health',
    name: 'Health & Well-Being',
    color: '#22C55E',
    taskTypes: ['Exercise', 'Walking', 'Meal tracking', 'Hydration', 'Sleep schedule']
  },
  {
    id: 'family',
    name: 'Family & Relationships',
    color: '#F59E0B',
    taskTypes: ['Family time', 'Call parents', 'Play with kids', 'Spouse time', 'Community service']
  },
  {
    id: 'work',
    name: 'Work & Study',
    color: '#3B82F6',
    taskTypes: ['Meetings', 'Deep work', 'Reading', 'Writing', 'Classes', 'Deadlines']
  },
  {
    id: 'personal',
    name: 'Personal Growth',
    color: '#8B5CF6',
    taskTypes: ['Journaling', 'Learning skills', 'Reading non-fiction', 'Language practice']
  },
  {
    id: 'errands',
    name: 'Errands & Household',
    color: '#F97316',
    taskTypes: ['Shopping', 'Cleaning', 'Bills', 'Repairs', 'Cooking']
  },
  {
    id: 'leisure',
    name: 'Rest & Leisure',
    color: '#F43F5E',
    taskTypes: ['Relax', 'Walk outdoors', 'Entertainment', 'Hobbies', 'Social time']
  },
  {
    id: 'other',
    name: 'Other / Miscellaneous',
    color: '#6B7280',
    taskTypes: ['Notes', 'Miscellaneous tasks', 'Catch-up items']
  }
];

const teamMembers = [
  { id: 'robert', name: 'Robert', avatar: '🧔' },
  { id: 'sophia', name: 'Sophia', avatar: '👩' },
  { id: 'ahmad', name: 'Ahmad', avatar: '👨' }
];

export function TaskCreationModal({ isOpen, onClose, selectedDate }: TaskCreationModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [selectedDate_, setSelectedDate_] = useState(selectedDate);
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleSubmit = () => {
    // Handle task creation
    console.log({
      title: taskTitle,
      description: taskDescription,
      category: selectedCategory,
      taskType: selectedTaskType,
      time: selectedTime,
      date: selectedDate_,
      assignedTo: assignedMembers
    });
    
    // Reset form
    setTaskTitle("");
    setTaskDescription("");
    setSelectedCategory("");
    setSelectedTaskType("");
    setSelectedTime("10:30");
    setAssignedMembers([]);
    
    onClose();
  };

  const toggleMemberAssignment = (memberId: string) => {
    setAssignedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 text-white border-slate-700">
        <DialogHeader className="flex flex-row items-center space-y-0 space-x-2 pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <DialogTitle className="text-white text-lg font-semibold">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-white font-medium">
              Task Title
            </Label>
            <Input
              id="task-title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
              data-testid="input-task-title"
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-details" className="text-white font-medium">
              Task Details
            </Label>
            <Textarea
              id="task-details"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe the task in detail..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 min-h-[80px] resize-none"
              data-testid="textarea-task-description"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Category</Label>
            <div className="grid grid-cols-1 gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedTaskType(""); // Reset task type when category changes
                  }}
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">
                        {category.name}
                      </h4>
                    </div>
                    {selectedCategory === category.id && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Type Selection */}
          {selectedCategoryData && (
            <div className="space-y-3">
              <Label className="text-white font-medium">Task Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedCategoryData.taskTypes.map((taskType) => (
                  <div
                    key={taskType}
                    className={`p-2 rounded-lg border cursor-pointer transition-all text-center ${
                      selectedTaskType === taskType
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onClick={() => setSelectedTaskType(taskType)}
                    data-testid={`task-type-${taskType.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <span className="text-sm text-white">{taskType}</span>
                    {selectedTaskType === taskType && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Assignment */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Assign To</Label>
            <div className="flex space-x-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    assignedMembers.includes(member.id)
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => toggleMemberAssignment(member.id)}
                  data-testid={`assign-${member.id}`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-600 text-white text-sm">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-white">{member.name}</span>
                  {assignedMembers.includes(member.id) && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time & Date */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Time & Date</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Time */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded-lg border border-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="bg-transparent border-none p-0 text-white focus:ring-0 focus:border-none"
                    data-testid="input-task-time"
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-slate-700 rounded-lg border border-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <Input
                    type="date"
                    value={selectedDate_}
                    onChange={(e) => setSelectedDate_(e.target.value)}
                    className="bg-transparent border-none p-0 text-white focus:ring-0 focus:border-none"
                    data-testid="input-task-date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <Button 
            onClick={handleSubmit}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3"
            disabled={!taskTitle || !selectedCategory || !selectedTaskType}
            data-testid="button-create-task"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}