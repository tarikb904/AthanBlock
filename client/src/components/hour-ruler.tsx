import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Prayer {
  id: string;
  name: string;
  time: string;
  completed: boolean;
}

interface HourRulerProps {
  selectedDate: string;
}

export function HourRuler({ selectedDate }: HourRulerProps) {
  const { data: prayers } = useQuery<Prayer[]>({
    queryKey: ["/api/prayers", selectedDate],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Generate 24 hour markers
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper function to convert time to position (0-100%)
  const timeToPosition = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  };

  const prayerColors = {
    'Fajr': '#ef4444', // red
    'Dhuhr': '#f97316', // orange
    'Asr': '#eab308', // yellow
    'Maghrib': '#8b5cf6', // violet
    'Isha': '#6366f1', // indigo
  };

  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-16 bg-card/95 backdrop-blur-sm border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-border">
        <div className="text-xs font-medium text-center text-muted-foreground">
          24h
        </div>
      </div>

      {/* Ruler Content */}
      <div className="flex-1 relative">
        {/* Hour markers */}
        <div className="absolute inset-0">
          {hours.map(hour => (
            <div
              key={hour}
              className="absolute right-0 w-full border-t border-border/30"
              style={{ top: `${(hour / 24) * 100}%` }}
            >
              <div className="absolute right-1 -mt-2 text-xs text-muted-foreground font-mono">
                {hour.toString().padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>

        {/* Prayer time markers */}
        {prayers?.map(prayer => {
          const position = timeToPosition(prayer.time);
          const color = prayerColors[prayer.name as keyof typeof prayerColors] || '#6b7280';
          
          return (
            <div
              key={prayer.id}
              className="absolute right-0 w-full flex items-center"
              style={{ top: `${position}%` }}
            >
              {/* Prayer marker line */}
              <div 
                className="w-full h-0.5 opacity-60"
                style={{ backgroundColor: color }}
              />
              
              {/* Prayer dot */}
              <div 
                className={`absolute right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                  prayer.completed ? 'bg-green-500' : ''
                }`}
                style={{ 
                  backgroundColor: prayer.completed ? '#22c55e' : color
                }}
                title={`${prayer.name} - ${prayer.time}`}
              />
              
              {/* Prayer name (on hover or always visible) */}
              <div className="absolute right-4 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                <div 
                  className="text-xs px-2 py-1 rounded text-white shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {prayer.name}
                </div>
              </div>
            </div>
          );
        })}

        {/* Current time indicator */}
        <div 
          className="absolute right-0 w-full flex items-center z-10"
          style={{ top: `${timeToPosition(format(new Date(), 'HH:mm'))}%` }}
        >
          <div className="w-full h-0.5 bg-primary" />
          <div className="absolute right-1 w-2 h-2 bg-primary rounded-full border border-white shadow-md" />
          <div className="absolute right-3 text-xs text-primary font-medium opacity-0 hover:opacity-100">
            Now
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <div className="text-xs text-center text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full mx-auto mb-1" />
          Now
        </div>
      </div>
    </div>
  );
}