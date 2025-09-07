import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: {
    name: string;
    lat: string;
    lon: string;
  }) => void;
  currentLocation?: string;
}

export function LocationPicker({ onLocationSelect, currentLocation }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { toast } = useToast();

  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Location search error:', error);
      toast({
        title: "Search Error",
        description: "Unable to search locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  const handleLocationDetect = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Please search for your location manually.",
        variant: "destructive",
      });
      return;
    }

    setDetectingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get location name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        );
        
        if (!response.ok) {
          throw new Error('Reverse geocoding failed');
        }
        
        const data = await response.json();
        const locationName = data.display_name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        
        onLocationSelect({
          name: locationName,
          lat: latitude.toString(),
          lon: longitude.toString(),
        });
        
        toast({
          title: "Location detected",
          description: `Location set to ${locationName}`,
        });
      } catch (geocodeError) {
        // Fallback to coordinates if reverse geocoding fails
        const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        onLocationSelect({
          name: locationName,
          lat: latitude.toString(),
          lon: longitude.toString(),
        });
        
        toast({
          title: "Location detected",
          description: "Location set using coordinates.",
        });
      }
      
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please search for your location manually.",
        variant: "destructive",
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLocationSelect = (result: LocationResult) => {
    onLocationSelect({
      name: result.display_name,
      lat: result.lat,
      lon: result.lon,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      {/* Current location display */}
      {currentLocation && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 dark:text-green-200">
              Current location: {currentLocation}
            </span>
          </div>
        </div>
      )}

      {/* Location detection button */}
      <Button 
        onClick={handleLocationDetect}
        disabled={detectingLocation}
        className="w-full"
        data-testid="button-detect-location"
      >
        {detectingLocation ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Detecting Location...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Use My Current Location
          </>
        )}
      </Button>

      {/* OR divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or search</span>
        </div>
      </div>

      {/* Search input */}
      <div className="space-y-2">
        <Label htmlFor="location-search">Search for your location</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="location-search"
            placeholder="Type city, country (e.g., Dubai, UAE)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-location-search"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Start typing to see location suggestions
        </p>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full p-3 text-left hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                  data-testid={`location-result-${result.place_id}`}
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.lat}, {result.lon}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {searchQuery.length >= 3 && !loading && searchResults.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No locations found for "{searchQuery}". Try different search terms.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}