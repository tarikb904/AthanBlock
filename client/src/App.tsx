import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Auth from "@/pages/auth";
import Planner from "@/pages/planner";
import Adhkar from "@/pages/adhkar";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import OnboardingPage from "@/pages/onboarding";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/">
        {() => {
          if (!isAuthenticated) return <Auth />;
          if (!user?.onboardingCompleted) return <OnboardingPage />;
          return <Dashboard />;
        }}
      </Route>
      <Route path="/auth" component={Auth} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/planner" component={Planner} />
      <Route path="/adhkar" component={Adhkar} />
      <Route path="/settings" component={Settings} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
