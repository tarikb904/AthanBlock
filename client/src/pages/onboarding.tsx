import { Onboarding } from "@/components/onboarding";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
      // Create or update user profile
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          location: userData.location,
          locationLat: userData.locationLat,
          locationLon: userData.locationLon,
          timezone: userData.timezone,
          prayerMethod: parseInt(userData.prayerMethod),
          madhab: parseInt(userData.madhab),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      // Fetch initial prayer times for the user's location
      if (userData.locationLat && userData.locationLon) {
        const today = new Date().toISOString().split('T')[0];
        await fetch('/api/prayers/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: parseFloat(userData.locationLat),
            lon: parseFloat(userData.locationLon),
            method: parseInt(userData.prayerMethod),
            madhab: parseInt(userData.madhab),
            start_date: today,
            days: 7,
          }),
        });
      }

      toast({
        title: "Welcome to Imaanify!",
        description: "Your profile has been set up successfully.",
      });

      // Navigate to dashboard
      navigate('/');
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