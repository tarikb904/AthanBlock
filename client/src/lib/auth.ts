import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  name?: string;
  location?: string;
  locationLat?: string;
  locationLon?: string;
  timezone?: string;
  prayerMethod?: number;
  madhab?: number;
  language?: string;
  darkMode?: boolean;
  notifications?: boolean;
  onboardingCompleted?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
} {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user/profile"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: async (data) => {
      // Store auth token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      queryClient.setQueryData(["/api/user/profile"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { email, password, name });
      return response.json();
    },
    onSuccess: async (data) => {
      // Store auth token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      queryClient.setQueryData(["/api/user/profile"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest("PATCH", "/api/user/profile", updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user/profile"], data);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, name: string) => {
    await registerMutation.mutateAsync({ email, password, name });
  };

  const logout = () => {
    // Clear auth token from localStorage
    localStorage.removeItem('auth_token');
    queryClient.clear();
    queryClient.setQueryData(["/api/user/profile"], null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    await updateProfileMutation.mutateAsync(updates);
  };

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };
}

export function getStoredToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setStoredToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function clearStoredToken(): void {
  localStorage.removeItem("auth_token");
}

export function initializeAuth(): void {
  // This would typically validate stored tokens with the server
  // For now, we'll rely on the profile query in useAuth
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return Promise.resolve("denied");
  }

  if (Notification.permission === "granted") {
    return Promise.resolve("granted");
  }

  return Notification.requestPermission();
}

export function scheduleNotification(title: string, body: string, scheduleTime: Date): void {
  if (Notification.permission === "granted") {
    const now = new Date();
    const delay = scheduleTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
        });
      }, delay);
    }
  }
}
