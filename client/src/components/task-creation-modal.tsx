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

const taskTypes = [
  { id: 'fard', name: 'Fard', description: 'Obligatory Islamic duties', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { id: 'wajib', name: 'Wajib', description: 'Essential Islamic practices', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { id: 'sunnah', name: 'Sunnah', description: 'Recommended prophetic practices', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { id: 'nafl', name: 'Nafl', description: 'Optional good deeds', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { id: 'adhkar', name: 'Adhkar', description: 'Remembrance of Allah', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { id: 'dua', name: 'Dua', description: 'Supplications and prayers', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
];

const teamMembers = [
  { id: 'robert', name: 'Robert', avatar: '🧔' },
  { id: 'sophia', name: 'Sophia', avatar: '👩' },
  { id: 'ahmad', name: 'Ahmad', avatar: '👨' }
];

export function TaskCreationModal({ isOpen, onClose, selectedDate }: TaskCreationModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [selectedDate_, setSelectedDate_] = useState(selectedDate);
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);

  const handleSubmit = () => {
    // Handle task creation
    console.log({
      title: taskTitle,
      description: taskDescription,
      taskType: selectedTaskType,
      time: selectedTime,
      date: selectedDate_,
      assignedTo: assignedMembers
    });
    
    // Reset form
    setTaskTitle("");
    setTaskDescription("");
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

          {/* Task Types */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Task Types</Label>
            <div className="grid grid-cols-2 gap-3">
              {taskTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedTaskType === type.id
                      ? 'border-blue-500 bg-blue-900/30'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedTaskType(type.id)}
                  data-testid={`task-type-${type.id}`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-sm">
                        {type.id === 'fard' && '🕌'}
                        {type.id === 'wajib' && '⚡'}
                        {type.id === 'sunnah' && '⭐'}
                        {type.id === 'nafl' && '✨'}
                        {type.id === 'adhkar' && '📿'}
                        {type.id === 'dua' && '🤲'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {type.name}
                      </h4>
                    </div>
                    {selectedTaskType === type.id && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

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
            disabled={!taskTitle || !selectedTaskType}
            data-testid="button-create-task"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}