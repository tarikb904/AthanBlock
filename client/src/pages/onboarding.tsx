import { Onboarding } from "@/components/onboarding";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleOnboardingComplete = async (userData: {
    name: string;
    location: string;
    locationLat: string;
    locationLon: string;
    timezone: string;
    prayerMethod: string;
    madhab: string;
  }) => {
    try {
      // Create or update user profile and mark onboarding as completed
      await apiRequest('POST', '/api/user/profile', {
        name: userData.name,
        location: userData.location,
        locationLat: userData.locationLat,
        locationLon: userData.locationLon,
        timezone: userData.timezone,
        prayerMethod: parseInt(userData.prayerMethod),
        madhab: parseInt(userData.madhab),
        onboardingCompleted: true, // Mark onboarding as completed
      });

      // Generate comprehensive prayer schedule for today
      if (userData.locationLat && userData.locationLon) {
        const today = new Date().toISOString().split('T')[0];
        
        // Generate comprehensive daily prayers (fard, sunnah, nafl, witr)
        await apiRequest('POST', `/api/prayers/${today}/comprehensive`, {
          lat: parseFloat(userData.locationLat),
          lon: parseFloat(userData.locationLon),
          method: parseInt(userData.prayerMethod),
          madhab: parseInt(userData.madhab),
        });

        // Also fetch prayer times for the week
        await apiRequest('POST', '/api/prayers/fetch', {
          lat: parseFloat(userData.locationLat),
          lon: parseFloat(userData.locationLon),
          method: parseInt(userData.prayerMethod),
          madhab: parseInt(userData.madhab),
          start_date: today,
          days: 7,
        });
      }

      toast({
        title: "Welcome to Imaanify!",
        description: "Your profile has been set up successfully.",
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Setup Error",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return <Onboarding onComplete={handleOnboardingComplete} />;
}