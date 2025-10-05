import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LocationPicker } from "@/components/location-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { User, MapPin, Globe, Bell, Download, Calendar, Apple } from "lucide-react";

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const { data: reminders } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const [formData, setFormData] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    location: profile?.location || "",
    locationLat: profile?.locationLat || "",
    locationLon: profile?.locationLon || "",
    timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    prayerMethod: profile?.prayerMethod || "ISNA",
    madhab: profile?.madhab || "Hanafi",
    language: profile?.language || "en",
    darkMode: profile?.darkMode ?? true,
    notifications: profile?.notifications ?? true,
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        location: profile.location || "",
        locationLat: profile.locationLat || "",
        locationLon: profile.locationLon || "",
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        prayerMethod: profile.prayerMethod || "ISNA",
        madhab: profile.madhab || "Hanafi",
        language: profile.language || "en",
        darkMode: profile.darkMode ?? true,
        notifications: profile.notifications ?? true,
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", "/api/user/profile", updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Profile updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error saving your settings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  // Detect timezone from coordinates using GeoNames API (free, no key required)
  const detectTimezone = async (lat: string, lon: string) => {
    try {
      // Use GeoNames API for timezone detection (free service)
      const response = await fetch(
        `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&username=demo`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.timezoneId) {
          return data.timezoneId;
        }
      }
    } catch (error) {
      console.error('Timezone detection error:', error);
    }
    
    // Fallback: compute approximate timezone from longitude
    // Longitude roughly corresponds to 15 degrees per hour offset from UTC
    const lonFloat = parseFloat(lon);
    if (!isNaN(lonFloat)) {
      const utcOffset = Math.round(lonFloat / 15);
      const offsetHours = Math.abs(utcOffset);
      const sign = utcOffset >= 0 ? '+' : '-';
      
      // Return IANA timezone ID based on offset (approximate)
      const timezoneMap: Record<string, string> = {
        '-12': 'Pacific/Wake',
        '-11': 'Pacific/Midway',
        '-10': 'Pacific/Honolulu',
        '-9': 'America/Anchorage',
        '-8': 'America/Los_Angeles',
        '-7': 'America/Denver',
        '-6': 'America/Chicago',
        '-5': 'America/New_York',
        '-4': 'America/Halifax',
        '-3': 'America/Argentina/Buenos_Aires',
        '-2': 'Atlantic/South_Georgia',
        '-1': 'Atlantic/Azores',
        '0': 'Europe/London',
        '+1': 'Europe/Paris',
        '+2': 'Europe/Athens',
        '+3': 'Asia/Riyadh',
        '+4': 'Asia/Dubai',
        '+5': 'Asia/Karachi',
        '+6': 'Asia/Dhaka',
        '+7': 'Asia/Bangkok',
        '+8': 'Asia/Singapore',
        '+9': 'Asia/Tokyo',
        '+10': 'Australia/Sydney',
        '+11': 'Pacific/Guadalcanal',
        '+12': 'Pacific/Auckland'
      };
      
      const timezoneKey = `${sign}${offsetHours}`;
      if (timezoneMap[timezoneKey]) {
        return timezoneMap[timezoneKey];
      }
    }
    
    // Final fallback to browser's timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const handleLocationSelect = async (location: { name: string; lat: string; lon: string }) => {
    // Detect timezone from coordinates
    const timezone = await detectTimezone(location.lat, location.lon);
    
    setFormData(prev => ({
      ...prev,
      location: location.name,
      locationLat: location.lat,
      locationLon: location.lon,
      timezone: timezone
    }));
    
    toast({
      title: "Location updated",
      description: `Set to ${location.name} (${timezone})`,
    });
  };

  const exportToCalendar = (type: string) => {
    toast({
      title: "Export initiated",
      description: `Your schedule will be exported to ${type}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading settings...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground font-serif">Settings & Profile</h1>
            <p className="text-muted-foreground">Customize your Islamic companion</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold">
                    {formData.name?.charAt(0) || "A"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground" data-testid="text-user-name">
                      {formData.name || "User"}
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="text-user-email">
                      {formData.email}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" data-testid="button-edit-profile">
                    <i className="fas fa-edit"></i>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <LocationPicker
                      onLocationSelect={handleLocationSelect}
                      currentLocation={formData.location}
                    />
                    {formData.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Current: {formData.location}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={formData.timezone}
                      readOnly
                      className="bg-muted"
                      data-testid="input-timezone"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically detected from your location
                    </p>
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* App Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-cog"></i>
                  <span>Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-card-foreground">Dark Mode</div>
                    <div className="text-sm text-muted-foreground">Automatic based on prayer times</div>
                  </div>
                  <Switch 
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    data-testid="switch-dark-mode"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-card-foreground">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Prayer times and reminders</div>
                  </div>
                  <Switch 
                    checked={formData.notifications}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
                    data-testid="switch-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-card-foreground">Offline Mode</div>
                    <div className="text-sm text-muted-foreground">Work without internet</div>
                  </div>
                  <Switch defaultChecked data-testid="switch-offline-mode" />
                </div>

                <div className="space-y-2">
                  <Label>Prayer Calculation Method</Label>
                  <Select value={formData.prayerMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, prayerMethod: value }))}>
                    <SelectTrigger data-testid="select-prayer-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISNA">Islamic Society of North America (ISNA)</SelectItem>
                      <SelectItem value="MWL">Muslim World League</SelectItem>
                      <SelectItem value="Egypt">Egyptian General Authority</SelectItem>
                      <SelectItem value="Makkah">Umm Al-Qura University, Makkah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Madhab</Label>
                  <Select value={formData.madhab} onValueChange={(value) => setFormData(prev => ({ ...prev, madhab: value }))}>
                    <SelectTrigger data-testid="select-madhab">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hanafi">Hanafi</SelectItem>
                      <SelectItem value="Shafi">Shafi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic (العربية)</SelectItem>
                      <SelectItem value="ur">Urdu (اردو)</SelectItem>
                      <SelectItem value="tr">Turkish (Türkçe)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export & Sync */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Export & Sync</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10 flex items-center justify-center space-x-2 p-4"
                  onClick={() => exportToCalendar("Google Calendar")}
                  data-testid="button-export-google"
                >
                  <i className="fab fa-google"></i>
                  <span>Google Calendar</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-secondary text-secondary hover:bg-secondary/10 flex items-center justify-center space-x-2 p-4"
                  onClick={() => exportToCalendar("Apple Calendar")}
                  data-testid="button-export-apple"
                >
                  <Apple className="w-4 h-4" />
                  <span>Apple Calendar</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-accent text-accent-foreground hover:bg-accent/10 flex items-center justify-center space-x-2 p-4"
                  onClick={() => exportToCalendar("CSV")}
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium text-card-foreground">Prayer Reminders</div>
                    <div className="text-sm text-muted-foreground">Get notified before each prayer</div>
                  </div>
                  <Switch defaultChecked data-testid="switch-prayer-reminders" />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium text-card-foreground">Adhkar Reminders</div>
                    <div className="text-sm text-muted-foreground">Morning and evening adhkar notifications</div>
                  </div>
                  <Switch defaultChecked data-testid="switch-adhkar-reminders" />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium text-card-foreground">Task Reminders</div>
                    <div className="text-sm text-muted-foreground">Custom task and habit notifications</div>
                  </div>
                  <Switch defaultChecked data-testid="switch-task-reminders" />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reminder timing</span>
                  <Select defaultValue="5">
                    <SelectTrigger className="w-32" data-testid="select-reminder-timing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute before</SelectItem>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="10">10 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium text-card-foreground">Data Backup</div>
                  <div className="text-sm text-muted-foreground">Automatically backup your data</div>
                </div>
                <Switch defaultChecked data-testid="switch-data-backup" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" data-testid="button-export-data">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
                <Button variant="outline" data-testid="button-clear-cache">
                  <i className="fas fa-trash w-4 h-4 mr-2"></i>
                  Clear Cache
                </Button>
                <Button variant="destructive" data-testid="button-delete-account">
                  <i className="fas fa-exclamation-triangle w-4 h-4 mr-2"></i>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
