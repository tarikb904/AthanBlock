import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type Adhkar } from "@shared/schema";
import { useState } from "react";
import { Play, Bookmark, Share, Check, Plus, Minus } from "lucide-react";

interface AdhkarCardProps {
  adhkar: Adhkar;
  showProgress?: boolean;
}

export function AdhkarCard({ adhkar, showProgress = false }: AdhkarCardProps) {
  const [currentCount, setCurrentCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const getIconClass = (category: string) => {
    const iconMap = {
      morning: "fas fa-sun",
      evening: "fas fa-moon",
      prayer: "fas fa-pray",
      sleep: "fas fa-bed",
      general: "fas fa-heart",
    };
    return iconMap[category as keyof typeof iconMap] || "fas fa-heart";
  };

  const getColorClasses = (category: string) => {
    const colorMap = {
      morning: "bg-primary/20 text-primary",
      evening: "bg-chart-5/20 text-chart-5",
      prayer: "bg-chart-1/20 text-chart-1",
      sleep: "bg-accent/20 text-accent-foreground",
      general: "bg-chart-2/20 text-chart-2",
    };
    return colorMap[category as keyof typeof colorMap] || colorMap.general;
  };

  const incrementCount = () => {
    if (currentCount < adhkar.repetitions) {
      const newCount = currentCount + 1;
      setCurrentCount(newCount);
      if (newCount === adhkar.repetitions) {
        setCompleted(true);
      }
    }
  };

  const decrementCount = () => {
    if (currentCount > 0) {
      setCurrentCount(currentCount - 1);
      setCompleted(false);
    }
  };

  const toggleCompleted = () => {
    if (completed) {
      setCurrentCount(0);
      setCompleted(false);
    } else {
      setCurrentCount(adhkar.repetitions);
      setCompleted(true);
    }
  };

  const progressPercentage = (currentCount / adhkar.repetitions) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(adhkar.category)}`}>
              <i className={getIconClass(adhkar.category)}></i>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground" data-testid={`text-adhkar-title-${adhkar.id}`}>
                {adhkar.titleEn}
              </h3>
              <p className="text-sm text-muted-foreground">
                {adhkar.category.charAt(0).toUpperCase() + adhkar.category.slice(1)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs" data-testid={`badge-repetitions-${adhkar.id}`}>
            {adhkar.repetitions}x
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Arabic Text */}
          <div 
            className="text-right font-serif text-lg leading-loose text-card-foreground" 
            dir="rtl"
            data-testid={`text-arabic-${adhkar.id}`}
          >
            {adhkar.textAr}
          </div>
          
          {/* English Translation */}
          <div className="text-sm text-muted-foreground" data-testid={`text-translation-${adhkar.id}`}>
            "{adhkar.textEn}"
          </div>

          {/* Transliteration */}
          {adhkar.transliteration && (
            <div className="text-sm font-mono text-accent-foreground italic" data-testid={`text-transliteration-${adhkar.id}`}>
              {adhkar.transliteration}
            </div>
          )}

          {/* Progress for repetitive adhkar */}
          {showProgress && adhkar.repetitions > 1 && (
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-primary" data-testid={`text-progress-${adhkar.id}`}>
                  {currentCount}/{adhkar.repetitions}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" data-testid={`button-play-${adhkar.id}`}>
              <Play className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid={`button-bookmark-${adhkar.id}`}>
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid={`button-share-${adhkar.id}`}>
              <Share className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            {showProgress && adhkar.repetitions > 1 ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={decrementCount}
                  disabled={currentCount === 0}
                  data-testid={`button-decrement-${adhkar.id}`}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={incrementCount}
                  disabled={currentCount >= adhkar.repetitions}
                  data-testid={`button-increment-${adhkar.id}`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant={completed ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 rounded-full p-0"
                onClick={toggleCompleted}
                data-testid={`button-complete-adhkar-${adhkar.id}`}
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
