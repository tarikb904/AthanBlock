import { Navigation } from "@/components/navigation";
import { getCurrentIslamicDate } from "@/lib/islamic-date";
import { useState } from "react";

export default function Planner() {
  const islamicDate = getCurrentIslamicDate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-serif">Daily Islamic Planner</h1>
              <p className="text-muted-foreground">Structure your day around Islamic principles • {islamicDate}</p>
            </div>
          </div>

          {/* Empty canvas - ready for your content */}
          <div className="min-h-96 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-lg text-muted-foreground">Your fresh canvas awaits</p>
              <p className="text-sm text-muted-foreground">Start building your Islamic planner here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}