import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { MapPin, Settings, LogOut, Clock, Globe } from "lucide-react";

const prayerMethods = [
  { value: 1, label: "University of Islamic Sciences, Karachi" },
  { value: 2, label: "Islamic Society of North America (ISNA)" },
  { value: 3, label: "Muslim World League (MWL)" },
  { value: 4, label: "Umm Al-Qura University, Makkah" },
  { value: 5, label: "Egyptian General Authority of Survey" }
];

const madhabs = [
  { value: 0, label: "Shafi/Maliki/Hanbali" },
  { value: 1, label: "Hanafi" }
];

export function ProfileDropdown() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  const handleLocationChange = () => {
    // Handle location change
    console.log('Location change requested');
  };

  const handlePrayerMethodChange = (methodId: number) => {
    // Handle prayer method change
    console.log('Prayer method changed to:', methodId);
  };

  const handleMadhabChange = (madhabId: number) => {
    // Handle madhab change
    console.log('Madhab changed to:', madhabId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-profile">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Location */}
        <DropdownMenuItem onClick={handleLocationChange} data-testid="menu-location">
          <MapPin className="mr-2 h-4 w-4" />
          <div className="flex flex-col flex-1">
            <span className="text-sm">Location</span>
            <span className="text-xs text-muted-foreground">
              {user?.location || 'Set your location'}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Prayer Time Provider */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="menu-prayer-provider">
            <Clock className="mr-2 h-4 w-4" />
            <div className="flex flex-col flex-1">
              <span className="text-sm">Prayer Time Provider</span>
              <span className="text-xs text-muted-foreground">
                {prayerMethods.find(m => m.value === (user?.prayerMethod || 2))?.label || 'ISNA'}
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {prayerMethods.map(method => (
              <DropdownMenuItem 
                key={method.value}
                onClick={() => handlePrayerMethodChange(method.value)}
                data-testid={`prayer-method-${method.value}`}
              >
                <div className="flex items-center w-full">
                  <span className="text-sm truncate">{method.label}</span>
                  {(user?.prayerMethod || 2) === method.value && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Madhab */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger data-testid="menu-madhab">
            <Globe className="mr-2 h-4 w-4" />
            <div className="flex flex-col flex-1">
              <span className="text-sm">Madhab</span>
              <span className="text-xs text-muted-foreground">
                {madhabs.find(m => m.value === (user?.madhab || 1))?.label || 'Hanafi'}
              </span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {madhabs.map(madhab => (
              <DropdownMenuItem 
                key={madhab.value}
                onClick={() => handleMadhabChange(madhab.value)}
                data-testid={`madhab-${madhab.value}`}
              >
                <div className="flex items-center w-full">
                  <span className="text-sm">{madhab.label}</span>
                  {(user?.madhab || 1) === madhab.value && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem data-testid="menu-settings">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}