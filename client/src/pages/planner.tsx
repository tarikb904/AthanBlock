import { Navigation } from "@/components/navigation";
import { DraggableDailyPlanner } from "@/components/draggable-daily-planner";
import { getCurrentIslamicDate } from "@/lib/islamic-date";
import { useState } from "react";

export default function Planner() {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DraggableDailyPlanner selectedDate={selectedDate} />
      </main>
    </div>
  );
}