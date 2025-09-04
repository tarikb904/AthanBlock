import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { type TimeBlock as TimeBlockType } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface TimeBlockProps {
  timeBlock: TimeBlockType;
  isNext?: boolean;
  showCurrentTime?: boolean;
}

export function TimeBlock({ timeBlock, isNext, showCurrentTime }: TimeBlockProps) {
  const queryClient = useQueryClient();

  const updateTimeBlockMutation = useMutation({
    mutationFn: async (updates: Partial<TimeBlockType>) => {
      const response = await apiRequest("PATCH", `/api/time-blocks/${timeBlock.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks"] });
    },
  });

  const getColorClasses = (color: string) => {
    const colorMap = {
      primary: "bg-primary/5 border-l-primary text-primary",
      accent: "bg-accent/5 border-l-accent text-accent-foreground",
      muted: "bg-muted/30 border-l-muted-foreground text-muted-foreground",
      "chart-1": "bg-chart-1/10 border-l-chart-1 text-chart-1",
      "chart-2": "bg-chart-2/10 border-l-chart-2 text-chart-2",
      "chart-3": "bg-chart-3/10 border-l-chart-3 text-chart-3",
      "chart-4": "bg-chart-4/10 border-l-chart-4 text-chart-4",
      "chart-5": "bg-chart-5/10 border-l-chart-5 text-chart-5",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.primary;
  };

  const getIconClass = (icon: string) => {
    const iconMap = {
      moon: "fas fa-moon",
      sun: "fas fa-sun",
      star: "fas fa-star",
      briefcase: "fas fa-briefcase",
      laptop: "fas fa-laptop",
      book: "fas fa-book",
    };
    return iconMap[icon as keyof typeof iconMap] || "fas fa-circle";
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const toggleCompletion = () => {
    updateTimeBlockMutation.mutate({ completed: !timeBlock.completed });
  };

  const updateTask = (taskId: string, completed: boolean) => {
    const updatedTasks = (timeBlock.tasks as any[])?.map(task => 
      task.id === taskId ? { ...task, completed } : task
    ) || [];
    
    updateTimeBlockMutation.mutate({ tasks: updatedTasks });
  };

  const completedTasks = (timeBlock.tasks as any[])?.filter(task => task.completed).length || 0;
  const totalTasks = (timeBlock.tasks as any[])?.length || 0;

  return (
    <>
      {showCurrentTime && (
        <div className="flex items-center space-x-4 py-2">
          <div className="w-2 h-2 bg-destructive rounded-full pulse-gentle"></div>
          <div className="flex-1 border-t border-destructive border-dashed"></div>
          <span className="text-sm font-medium text-destructive flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Current Time: {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
          </span>
          <div className="flex-1 border-t border-destructive border-dashed"></div>
        </div>
      )}
      
      <Card 
        className={`time-block border-l-4 ${getColorClasses(timeBlock.color || "primary")} ${
          isNext ? "ring-2 ring-primary/30" : ""
        } ${timeBlock.completed ? "opacity-75" : ""}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-mono font-medium" data-testid={`text-time-${timeBlock.id}`}>
                {timeBlock.startTime.slice(0, 5)} {/* HH:MM */}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isNext ? "pulse-gentle" : ""
                } ${getColorClasses(timeBlock.color || "primary").replace("text-", "bg-").replace("/5", "/20")}`}>
                  <i className={`${getIconClass(timeBlock.icon || "circle")} text-sm`}></i>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-card-foreground" data-testid={`text-title-${timeBlock.id}`}>
                    {timeBlock.title}
                  </h4>
                  <p className="text-sm text-muted-foreground" data-testid={`text-description-${timeBlock.id}`}>
                    {timeBlock.description}
                  </p>
                  {isNext && (
                    <span className="text-xs font-medium text-primary">
                      NEXT IN {Math.ceil((new Date(`2024-01-01T${timeBlock.startTime}`).getTime() - new Date(`2024-01-01T${new Date().toTimeString().slice(0, 8)}`).getTime()) / (1000 * 60))} MINUTES
                    </span>
                  )}
                  
                  {/* Tasks */}
                  {timeBlock.tasks && (timeBlock.tasks as any[]).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(timeBlock.tasks as any[]).map((task: any) => (
                        <div 
                          key={task.id}
                          className="flex items-center space-x-1 text-xs"
                        >
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={(checked) => updateTask(task.id, !!checked)}
                            className="w-3 h-3"
                            data-testid={`checkbox-task-${task.id}`}
                          />
                          <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="text-xs">
                {formatDuration(timeBlock.duration)}
              </Badge>
              
              {totalTasks > 0 && (
                <Badge variant="outline" className="text-xs">
                  {completedTasks}/{totalTasks}
                </Badge>
              )}
              
              <Button
                variant={timeBlock.completed ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 rounded-full p-0"
                onClick={toggleCompletion}
                disabled={updateTimeBlockMutation.isPending}
                data-testid={`button-complete-timeblock-${timeBlock.id}`}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
