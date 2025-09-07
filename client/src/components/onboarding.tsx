import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Globe, BookOpen, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Imaanify",
    subtitle: "Your Islamic Daily Companion",
    icon: BookOpen,
  },
  {
    id: "location",
    title: "Set Your Location",
    subtitle: "We need your location for accurate prayer times",
    icon: MapPin,
  },
  {
    id: "preferences",
    title: "Islamic Preferences", 
    subtitle: "Choose your prayer calculation method and madhab",
    icon: Globe,
  },
  {
    id: "complete",
    title: "You're All Set!",
    subtitle: "Start your Islamic journey with Imaanify",
    icon: Clock,
  },
];

const prayerMethods = [
  { value: "2", label: "ISNA (Islamic Society of North America)" },
  { value: "3", label: "MWL (Muslim World League)" },
  { value: "5", label: "Egyptian General Authority" },
  { value: "4", label: "Umm Al-Qura University, Makkah" },
  { value: "1", label: "University of Islamic Sciences, Karachi" },
];

const madhabOptions = [
  { value: "1", label: "Hanafi" },
  { value: "0", label: "Shafi/Maliki/Hanbali" },
];

interface OnboardingProps {
  onComplete: (userData: {
    name: string;
    location: string;
    locationLat: string;
    locationLon: string;
    timezone: string;
    prayerMethod: string;
    madhab: string;
  }) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    locationLat: "",
    locationLon: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    prayerMethod: "2", // ISNA default
    madhab: "1", // Hanafi default
  });

  const currentStepData = steps[currentStep];

  const handleLocationDetect = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please enter your location manually.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get city name
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await response.json();
        const locationName = data.city || data.locality || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        
        setFormData(prev => ({
          ...prev,
          location: locationName,
          locationLat: latitude.toString(),
          locationLon: longitude.toString(),
        }));
        
        setLocationPermission('granted');
        toast({
          title: "Location detected successfully",
          description: `Location set to ${locationName}`,
        });
      } catch (geocodeError) {
        // Fallback to coordinates if reverse geocoding fails
        setFormData(prev => ({
          ...prev,
          location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
          locationLat: latitude.toString(),
          locationLon: longitude.toString(),
        }));
        
        setLocationPermission('granted');
        toast({
          title: "Location detected",
          description: "Location has been set using coordinates.",
        });
      }
      
    } catch (error) {
      setLocationPermission('denied');
      toast({
        title: "Location access denied",
        description: "Please enter your location manually below.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.location) {
      toast({
        title: "Location required",
        description: "Please set your location to continue.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2 && !formData.name) {
      toast({
        title: "Name required", 
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Welcome to Imaanify</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your comprehensive Islamic daily companion. Plan your worship, track prayers, 
                and strengthen your faith with guided daily activities.
              </p>
            </div>
            <div className="space-y-4">
              <Label htmlFor="name">What should we call you?</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-name"
              />
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-chart-2/20 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-12 h-12 text-chart-2" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Set Your Location</h2>
                <p className="text-muted-foreground">
                  We need your location to provide accurate prayer times for your area.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {locationPermission === 'pending' && (
                <Button 
                  onClick={handleLocationDetect}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-detect-location"
                >
                  {loading ? "Detecting..." : "Use My Current Location"}
                </Button>
              )}

              {locationPermission === 'granted' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    ✓ Location detected: {formData.location}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="manual-location">Or enter manually:</Label>
                <Input
                  id="manual-location"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  data-testid="input-location"
                />
                <p className="text-xs text-muted-foreground">
                  Example: New York, USA or London, UK
                </p>
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-chart-3/20 rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-12 h-12 text-chart-3" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Islamic Preferences</h2>
                <p className="text-muted-foreground">
                  Choose your preferred prayer calculation method and school of thought.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Prayer Calculation Method</Label>
                <Select 
                  value={formData.prayerMethod} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, prayerMethod: value }))}
                >
                  <SelectTrigger data-testid="select-prayer-method">
                    <SelectValue placeholder="Select prayer method" />
                  </SelectTrigger>
                  <SelectContent>
                    {prayerMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This determines how prayer times are calculated for your location.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Madhab (School of Thought)</Label>
                <Select 
                  value={formData.madhab} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, madhab: value }))}
                >
                  <SelectTrigger data-testid="select-madhab">
                    <SelectValue placeholder="Select madhab" />
                  </SelectTrigger>
                  <SelectContent>
                    {madhabOptions.map((madhab) => (
                      <SelectItem key={madhab.value} value={madhab.value}>
                        {madhab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This affects the calculation of Asr prayer time.
                </p>
              </div>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-12 h-12 text-green-600" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Welcome to Imaanify, {formData.name}! Your Islamic daily companion is ready to help 
                you organize your worship and strengthen your faith.
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{formData.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prayer Method:</span>
                <span className="font-medium">
                  {prayerMethods.find(m => m.value === formData.prayerMethod)?.label || 'ISNA'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Madhab:</span>
                <span className="font-medium">
                  {madhabOptions.find(m => m.value === formData.madhab)?.label || 'Hanafi'}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <currentStepData.icon className="w-6 h-6" />
            <span>{currentStepData.title}</span>
          </CardTitle>
          <p className="text-muted-foreground">{currentStepData.subtitle}</p>
          
          {/* Progress indicator */}
          <div className="flex space-x-2 justify-center mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStepContent()}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              data-testid="button-previous"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                data-testid="button-next"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                data-testid="button-complete"
              >
                Start Using Imaanify
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}