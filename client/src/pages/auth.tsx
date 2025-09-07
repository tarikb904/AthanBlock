import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; name?: string }) => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await apiRequest("POST", endpoint, userData);
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: isLogin ? "Welcome back!" : "Account created successfully!",
        description: isLogin ? "Redirecting to your dashboard..." : "Let's set up your profile...",
      });

      // For new registrations, redirect to onboarding
      if (!isLogin) {
        setTimeout(() => setLocation("/onboarding"), 1000);
        return;
      }

      // For login, check if user profile is complete
      setTimeout(async () => {
        try {
          const profileResponse = await fetch("/api/user/profile", {
            credentials: 'include' // Include cookies/session
          });
          
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            // If user has location and prayer preferences, go to dashboard
            if (profile.location && profile.prayerMethod && profile.madhab) {
              setLocation("/dashboard");
            } else {
              // User needs to complete profile setup
              setLocation("/onboarding");
            }
          } else {
            console.error('Profile fetch failed:', profileResponse.status);
            // Profile not found, redirect to onboarding
            setLocation("/onboarding");
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
          // Error fetching profile, redirect to onboarding
          setLocation("/onboarding");
        }
      }, 1500); // Give session time to be established
    },
    onError: (error: any) => {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authMutation.mutate({
      email,
      password,
      ...(isLogin ? {} : { name }),
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Hero Section */}
      <div className="flex-1 relative islamic-pattern overflow-hidden bg-background">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                  <i className="fas fa-mosque text-primary-foreground text-lg"></i>
                </div>
                <span className="font-serif font-bold text-2xl text-foreground">Imaanify</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground font-serif leading-tight">
                Your Digital{" "}
                <span className="text-primary">Islamic</span>{" "}
                Companion
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Plan your day around the 5 pillars. Track prayers, manage Islamic schedules, 
                and strengthen your connection with Allah through organized worship.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <Button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2">
                <i className="fas fa-download"></i>
                <span>Download App</span>
              </Button>
              <Button 
                variant="outline" 
                className="px-8 py-4 rounded-lg font-semibold"
                onClick={() => setLocation("/onboarding")}
                data-testid="button-try-web"
              >
                Try Web Version
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <i className="fas fa-check-circle text-primary"></i>
                <span>Free to use</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-shield-alt text-primary"></i>
                <span>Privacy focused</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-mobile-alt text-primary"></i>
                <span>Works offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form */}
      <div className="flex-none w-full max-w-md bg-card border-l border-border p-8">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold font-serif">
              {isLogin ? "Welcome Back" : "Get Started"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                data-testid="button-google-auth"
              >
                <i className="fab fa-google text-red-500 mr-3"></i>
                Continue with Google
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-black border border-gray-800 text-white hover:bg-gray-900"
                data-testid="button-apple-auth"
              >
                <i className="fab fa-apple mr-3"></i>
                Continue with Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmed Ibrahim"
                    required={!isLogin}
                    data-testid="input-name"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  data-testid="input-password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={authMutation.isPending}
                data-testid="button-submit-auth"
              >
                {authMutation.isPending 
                  ? "Loading..." 
                  : isLogin 
                    ? "Sign In" 
                    : "Create Account"
                }
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
                data-testid="button-toggle-auth-mode"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
