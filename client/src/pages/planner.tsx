import { Navigation } from "@/components/navigation";
import { TimeBlock } from "@/components/time-block";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentIslamicDate } from "@/lib/islamic-date";

export default function Planner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const islamicDate = getCurrentIslamicDate();

  const { data: timeBlocks, isLoading } = useQuery({
    queryKey: ["/api/time-blocks", today],
  });

  const copyTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/time-blocks/${today}/copy-template`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-blocks", today] });
      toast({
        title: "Template copied",
        description: "Your daily schedule has been created from the Islamic template.",
      });
    },
  });

  const currentTime = new Date();
  const currentTimeString = format(currentTime, "HH:mm:ss");

  // Find the next time block
  const nextTimeBlock = timeBlocks?.find((block: any) => 
    block.startTime > currentTimeString && !block.completed
  );

  // Calculate completion percentage
  const completedBlocks = timeBlocks?.filter((block: any) => block.completed).length || 0;
  const totalBlocks = timeBlocks?.length || 0;
  const completionPercentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading your daily planner...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif">Daily Islamic Planner</h1>
              <p className="text-muted-foreground">Structure your day around Islamic principles</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => copyTemplateMutation.mutate()}
                disabled={copyTemplateMutation.isPending || (timeBlocks && timeBlocks.length > 0)}
                data-testid="button-copy-template"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copyTemplateMutation.isPending ? "Copying..." : "Copy Template"}
              </Button>
              <Button variant="outline" data-testid="button-weekly-view">
                <CalendarDays className="w-4 h-4 mr-2" />
                Weekly View
              </Button>
            </div>
          </div>

          {/* Schedule Header */}
          <Card>
            <CardHeader className="bg-muted/50 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span data-testid="text-today-date">
                      {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </span>
                    <span className="text-primary" data-testid="text-islamic-date">{islamicDate}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Completion: <span className="text-primary font-medium" data-testid="text-completion-percentage">{completionPercentage}%</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              {!timeBlocks || timeBlocks.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-2">No schedule for today</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by copying the Islamic daily template to organize your day around prayers and worship.
                    </p>
                    <Button 
                      onClick={() => copyTemplateMutation.mutate()}
                      disabled={copyTemplateMutation.isPending}
                      data-testid="button-create-schedule"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Create Today's Schedule
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeBlocks.map((timeBlock: any, index: number) => {
                    const isNext = nextTimeBlock?.id === timeBlock.id;
                    const shouldShowCurrentTime = 
                      index < timeBlocks.length - 1 && 
                      timeBlocks[index + 1]?.startTime > currentTimeString &&
                      timeBlock.startTime <= currentTimeString;

                    return (
                      <TimeBlock
                        key={timeBlock.id}
                        timeBlock={timeBlock}
                        isNext={isNext}
                        showCurrentTime={shouldShowCurrentTime}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
