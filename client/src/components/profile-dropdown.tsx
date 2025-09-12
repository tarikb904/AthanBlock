import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { MapPin, Settings, LogOut, Clock, Globe, Tags, Palette } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const prayerMethods = [
  { value: 1, label: "University of Islamic Sciences, Karachi" },
  { value: 2, label: "Islamic Society of North America (ISNA)" },
  { value: 3, label: "Muslim World League (MWL)" },
  { value: 4, label: "Umm Al-Qura University, Makkah" },
  { value: 5, label: "Egyptian General Authority of Survey" }
];

const madhabs = [
  { value: 0, label: "Shafi/Maliki/Hanbali" },
  { value: 1, label: "Hanafi" }
];

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

export function ProfileDropdown() {
  const { user } = useAuth();
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [userCategories, setUserCategories] = useState(categories);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingTaskType, setEditingTaskType] = useState<{categoryId: string, index: number} | null>(null);
  const [newTaskType, setNewTaskType] = useState('');

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const handleLocationChange = () => {
    // Handle location change
    console.log('Location change requested');
  };

  const handlePrayerMethodChange = (methodId: number) => {
    // Handle prayer method change
    console.log('Prayer method changed to:', methodId);
  };

  const handleMadhabChange = (madhabId: number) => {
    // Handle madhab change
    console.log('Madhab changed to:', madhabId);
  };

  const handleColorChange = (categoryId: string, newColor: string) => {
    setUserCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, color: newColor } : cat
      )
    );
  };

  const handleTaskTypeEdit = (categoryId: string, taskTypeIndex: number, newValue: string) => {
    setUserCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? {
              ...cat, 
              taskTypes: cat.taskTypes.map((type, idx) => 
                idx === taskTypeIndex ? newValue : type
              )
            }
          : cat
      )
    );
    setEditingTaskType(null);
  };

  const handleAddTaskType = (categoryId: string) => {
    if (newTaskType.trim()) {
      setUserCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, taskTypes: [...cat.taskTypes, newTaskType.trim()] }
            : cat
        )
      );
      setNewTaskType('');
    }
  };

  const handleRemoveTaskType = (categoryId: string, taskTypeIndex: number) => {
    setUserCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? {
              ...cat, 
              taskTypes: cat.taskTypes.filter((_, idx) => idx !== taskTypeIndex)
            }
          : cat
      )
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-profile">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Location */}
        <DropdownMenuItem onClick={handleLocationChange} data-testid="menu-location">
          <MapPin className="mr-2 h-4 w-4" />
          <div className="flex flex-col flex-1">
            <span className="text-sm">Location</span>
            <span className="text-xs text-muted-foreground">
              {user?.location || 'Set your location'}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Prayer Time Provider */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="menu-prayer-provider">
            <Clock className="mr-2 h-4 w-4" />
            <div className="flex flex-col flex-1">
              <span className="text-sm">Prayer Time Provider</span>
              <span className="text-xs text-muted-foreground">
                {prayerMethods.find(m => m.value === (user?.prayerMethod || 2))?.label || 'ISNA'}
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {prayerMethods.map(method => (
              <DropdownMenuItem 
                key={method.value}
                onClick={() => handlePrayerMethodChange(method.value)}
                data-testid={`prayer-method-${method.value}`}
              >
                <div className="flex items-center w-full">
                  <span className="text-sm truncate">{method.label}</span>
                  {(user?.prayerMethod || 2) === method.value && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Madhab */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="menu-madhab">
            <Globe className="mr-2 h-4 w-4" />
            <div className="flex flex-col flex-1">
              <span className="text-sm">Madhab</span>
              <span className="text-xs text-muted-foreground">
                {madhabs.find(m => m.value === (user?.madhab || 1))?.label || 'Hanafi'}
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {madhabs.map(madhab => (
              <DropdownMenuItem 
                key={madhab.value}
                onClick={() => handleMadhabChange(madhab.value)}
                data-testid={`madhab-${madhab.value}`}
              >
                <div className="flex items-center w-full">
                  <span className="text-sm">{madhab.label}</span>
                  {(user?.madhab || 1) === madhab.value && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Categories & Task Types */}
        <DropdownMenuItem onClick={() => setShowCategoriesModal(true)} data-testid="menu-categories">
          <Tags className="mr-2 h-4 w-4" />
          <span>Categories & Task Types</span>
        </DropdownMenuItem>

        {/* Settings */}
        <DropdownMenuItem data-testid="menu-settings">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Categories Management Modal */}
    <Dialog open={showCategoriesModal} onOpenChange={setShowCategoriesModal}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Manage Categories & Task Types
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {userCategories.map((category) => (
            <div key={category.id} className="space-y-4 p-4 border rounded-lg">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => handleColorChange(category.id, e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    data-testid={`color-picker-${category.id}`}
                  />
                </div>
              </div>

              {/* Task Types */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Task Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {category.taskTypes.map((taskType, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      {editingTaskType?.categoryId === category.id && editingTaskType?.index === index ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={taskType}
                            onChange={(e) => {
                              const newTaskTypes = [...category.taskTypes];
                              newTaskTypes[index] = e.target.value;
                              setUserCategories(prev => 
                                prev.map(cat => 
                                  cat.id === category.id ? { ...cat, taskTypes: newTaskTypes } : cat
                                )
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTaskTypeEdit(category.id, index, e.currentTarget.value);
                              }
                              if (e.key === 'Escape') {
                                setEditingTaskType(null);
                              }
                            }}
                            onBlur={(e) => handleTaskTypeEdit(category.id, index, e.target.value)}
                            className="text-sm"
                            autoFocus
                            data-testid={`edit-task-type-${category.id}-${index}`}
                          />
                        </div>
                      ) : (
                        <>
                          <Badge 
                            variant="secondary" 
                            className="flex-1 cursor-pointer justify-start"
                            onClick={() => setEditingTaskType({ categoryId: category.id, index })}
                            style={{ borderColor: category.color }}
                            data-testid={`task-type-${category.id}-${index}`}
                          >
                            {taskType}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTaskType(category.id, index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            data-testid={`remove-task-type-${category.id}-${index}`}
                          >
                            ×
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add new task type */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add new task type..."
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTaskType(category.id);
                      }
                    }}
                    className="text-sm"
                    data-testid={`add-task-type-input-${category.id}`}
                  />
                  <Button
                    onClick={() => handleAddTaskType(category.id)}
                    disabled={!newTaskType.trim()}
                    size="sm"
                    data-testid={`add-task-type-button-${category.id}`}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <Separator />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setShowCategoriesModal(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            // Save categories to user preferences or API
            console.log('Saving categories:', userCategories);
            setShowCategoriesModal(false);
          }}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}