'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiRequest, API_ENDPOINTS } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionContextType {
  user: User | null;
  resetTimer: () => void;
  handleLogout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Login State for Re-auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const warningLevelRef = useRef<number>(0); // 0: none, 1: 15m, 2: 10m, 3: 5m

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningLevelRef.current = 0;
    setShowTimeoutDialog(false);
    setIsSessionExpired(false);
    setAuthError('');
  }, []);

  const handleLogout = useCallback(async () => {
    // Clear user object from localStorage
    localStorage.removeItem('user');

    // Ask backend to clear httpOnly auth cookies
    try {
      await apiRequest(API_ENDPOINTS.auth.logout, { method: 'POST' });
    } catch {
      // Proceed with client-side logout even if the request fails
    }

    // Reset state
    setUser(null);
    setShowTimeoutDialog(false);
    setIsSessionExpired(false);
    warningLevelRef.current = 0;

    // Redirect
    router.push('/login');

  }, [router]);

  const handleReLogin = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;
      setAuthError('');
      setIsSubmitting(true);
      try {
          const response = await apiRequest<{ success: boolean; data?: { user?: User } }>(
              API_ENDPOINTS.auth.login,
              {
                  method: 'POST',
                  body: JSON.stringify({ email, password }),
              }
          );
          if (response.success && response.data) {
              if (response.data.user) {
                  localStorage.setItem('user', JSON.stringify(response.data.user));
                  setUser(response.data.user);
                  resetTimer();
                  return;
              }
              setAuthError('Login failed. Unexpected server response.');
              return;
          }
          setAuthError('Login failed. Please check your credentials.');
      } catch (err) {
          const message = err instanceof Error ? err.message : '';
          if (message.includes('timeout') || message.includes('connect') || message.includes('network')) {
              setAuthError('Network error. Please check your connection and try again.');
          } else {
              setAuthError('Invalid credentials. Please try again.');
          }
      } finally {
          setIsSubmitting(false);
      }
  }, [email, password, isSubmitting, setUser, resetTimer]);

  useEffect(() => {
      // Pre-fill email/user if user exists
      const userStr = localStorage.getItem('user');
      if (userStr) {
          try {
              const parsedUser = JSON.parse(userStr);
              setUser(parsedUser);
              if (parsedUser.email) setEmail(parsedUser.email);
          } catch (e) {
              // ignore
          }
      }
  }, []);

  useEffect(() => {
    // Activity listeners
    const handleActivity = () => {
      // Only reset automatically if we haven't reached the critical 5m warning OR if expired
      if (warningLevelRef.current < 3 && !isSessionExpired) {
        resetTimer();
      }
    };

    if (!isSessionExpired) {
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
    }

    // Timer check
    const intervalId = setInterval(() => {
      if (isSessionExpired) return; // Stop checking if already expired

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = SESSION_TIMEOUT_MS - elapsed;

      // Check for logout
      if (remaining <= 0) {
        setIsSessionExpired(true);
        setShowTimeoutDialog(false); // Close warning dialog if open
        return;
      }

      // Check for 5 min warning (Critical - Dialog)
      if (remaining <= 5 * 60 * 1000 && warningLevelRef.current < 3) {
        warningLevelRef.current = 3;
        setShowTimeoutDialog(true);
        return; 
      }

      // Check for 10 min warning (Toast)
      if (remaining <= 10 * 60 * 1000 && remaining > 5 * 60 * 1000 && warningLevelRef.current < 2) {
        warningLevelRef.current = 2;
        toast({
          title: 'Session Warning',
          description: 'Your session will expire in 10 minutes.',
          variant: 'default',
          duration: 5000,
        });
        return;
      }

      // Check for 15 min warning (Toast)
      if (remaining <= 15 * 60 * 1000 && remaining > 10 * 60 * 1000 && warningLevelRef.current < 1) {
        warningLevelRef.current = 1;
        toast({
          title: 'Session Check',
          description: 'Your session will expire in 15 minutes.',
          duration: 3000,
        });
        return;
      }

    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(intervalId);
    };
  }, [handleLogout, resetTimer, toast, isSessionExpired]);

  return (
    <SessionContext.Provider value={{ user, resetTimer, handleLogout }}>
      {children}
      
      {/* Warning Dialog */}
      <AlertDialog open={showTimeoutDialog} onOpenChange={setShowTimeoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
            <AlertDialogDescription>
              Your session will expire in less than 5 minutes due to inactivity. 
              Would you like to stay logged in?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <Button variant="ghost" onClick={handleLogout} className="mr-2">Logout</Button>
            <AlertDialogAction onClick={resetTimer}>
              Extend Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Expired Overlay (Login) */}
      {isSessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 bg-card border rounded-lg shadow-2xl animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-bold text-center mb-2">Session Expired</h2>
                <p className="text-center text-muted-foreground mb-6">Please log in again to continue working.</p>
                
                {authError && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 font-medium">
                        {authError}
                    </div>
                )}

                <form onSubmit={handleReLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="re-email">Email</Label>
                        <Input 
                            id="re-email" 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="re-password">Password</Label>
                        <Input 
                            id="re-password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Password"
                            required 
                        />
                    </div>
                    <div className="flex gap-4 pt-2">
                         <Button type="button" variant="outline" className="flex-1" onClick={handleLogout}>
                            Logout
                         </Button>
                         <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Resume Session'}
                         </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
