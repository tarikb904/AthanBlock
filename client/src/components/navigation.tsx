import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Bell, Sun, Moon, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProfileDropdown } from "./profile-dropdown";

export function Navigation() {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/planner", label: "Daily Planner" },
    { href: "/adhkar", label: "Adhkar" },
    { href: "/settings", label: "Settings" },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard">
            <div className="flex items-center space-x-2 cursor-pointer" data-testid="link-logo">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-mosque text-primary-foreground text-sm"></i>
              </div>
              <span className="font-serif font-bold text-xl text-foreground">Imaanify</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <a 
                  className={`transition-colors ${
                    location === link.href 
                      ? "text-primary" 
                      : "text-foreground hover:text-primary"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(" ", "-")}`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <ProfileDropdown />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              data-testid="button-mobile-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-4 mt-8">
                  {navLinks.map(link => (
                    <Link key={link.href} href={link.href}>
                      <a 
                        className={`block px-4 py-2 rounded-lg transition-colors ${
                          location === link.href 
                            ? "bg-primary text-primary-foreground" 
                            : "text-foreground hover:bg-accent"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(" ", "-")}`}
                      >
                        {link.label}
                      </a>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
