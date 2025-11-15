'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User, AuthSession } from "@/types";
import {
  createSession,
  saveSession,
  getSessionData,
  clearSession,
  isSessionExpiringSoon,
  extendSession,
  getSessionToken,
  getSessionUser,
} from "@/utils/sessionManager";

// ⚠️ AUTH BYPASS FLAG - FOR DEVELOPMENT ONLY
// When true, all authentication checks are bypassed
// To disable auth: Set NEXT_PUBLIC_DISABLE_AUTH=true in .env.local
// To re-enable auth: Set NEXT_PUBLIC_DISABLE_AUTH=false or remove the line
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';

if (AUTH_DISABLED) {
  console.warn('🚨 AUTHENTICATION IS DISABLED - Development mode only!');
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: AuthSession | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  refreshSession: () => boolean;
  isSessionExpiring: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
    setIsSessionExpiring(false);
    console.log("✅ Logout successful, session cleared");
  }, []);

  /**
   * Initialize session from storage on mount
   */
  const initializeSession = useCallback(() => {
    // ⚠️ AUTH BYPASS: Skip session initialization if auth is disabled
    if (AUTH_DISABLED) {
      setIsAuthenticated(true);
      setUser({
        id: 'dev-user',
        username: 'dev-user',
        email: 'dev@example.com',
        role: 'admin',
      });
      setIsInitialized(true);
      console.log('🚨 Auth disabled - bypassing session check');
      return;
    }

    // CRITICAL: Only run in browser environment
    if (typeof window === "undefined") {
      console.warn("[Auth] Skipping session initialization - SSR context");
      return;
    }

    const sessionData = getSessionData();

    if (sessionData.isValid && sessionData.session) {
      setIsAuthenticated(true);
      setUser(sessionData.session.user);
      setSession(sessionData.session);
      setIsInitialized(true);
      console.log("✅ Session restored from storage");
    } else if (sessionData.isExpired) {
      console.log("⚠️ Session expired, clearing authentication");
      handleLogout();
      setIsInitialized(true);
    } else {
      setIsInitialized(true);
      console.log("ℹ️ No valid session found");
    }
  }, [handleLogout]);

  /**
   * Initialize session on mount (client-side only)
   */
  useEffect(() => {
    // Only run once on mount, after hydration
    initializeSession();
  }, []); // Empty deps - run once on mount

  /**
   * Check session expiration periodically
   */
  useEffect(() => {
    // Only start interval after initialization
    if (!isInitialized) {
      return;
    }

    // Check session expiration every minute
    const intervalId = setInterval(() => {
      const sessionData = getSessionData();

      if (sessionData.isExpired) {
        console.log("⚠️ Session expired during check");
        handleLogout();
      } else if (sessionData.isValid) {
        // Check if session is expiring soon (within 5 minutes)
        const expiringSoon = isSessionExpiringSoon(5);
        setIsSessionExpiring(expiringSoon);

        if (expiringSoon) {
          console.log("⚠️ Session expiring soon");
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isInitialized, handleLogout]);

  /**
   * Handle user login
   */
  const login = (username: string, password: string): boolean => {
    try {
      // ⚠️ AUTH BYPASS: Auto-login if auth is disabled
      if (AUTH_DISABLED) {
        setIsAuthenticated(true);
        setUser({
          id: 'dev-user',
          username: username || 'dev-user',
          email: 'dev@example.com',
          role: 'admin',
        });
        console.log('🚨 Auth disabled - auto-login successful');
        return true;
      }

      // Simple auth - replace with real authentication API call
      if (username === "admin" && password === "admin123") {
        const userData: User = {
          username,
          email: "admin@example.com",
          role: "admin",
          id: "1",
        };

        // Create session with 24-hour expiration
        const newSession = createSession(
          "dummy-token-" + Date.now(), // Replace with real token from API
          userData,
          24 * 60 * 60 // 24 hours in seconds
        );

        // Save session to storage
        const saved = saveSession(newSession);

        if (saved) {
          setIsAuthenticated(true);
          setUser(userData);
          setSession(newSession);
          setIsSessionExpiring(false);
          console.log("✅ Login successful, session created");
          return true;
        } else {
          console.error("❌ Failed to save session to localStorage");
          return false;
        }
      }

      console.log("❌ Invalid credentials");
      return false;
    } catch (error) {
      console.error("❌ Login error:", error);
      return false;
    }
  };

  const logout = () => {
    handleLogout();
  };

  /**
   * Refresh/extend the current session
   */
  const refreshSession = (): boolean => {
    try {
      const extended = extendSession(24 * 60 * 60); // Extend by 24 hours

      if (extended) {
        // Reload session data
        const sessionData = getSessionData();
        if (sessionData.isValid && sessionData.session) {
          setSession(sessionData.session);
          setIsSessionExpiring(false);
          console.log("✅ Session refreshed successfully");
          return true;
        }
      }

      console.log("❌ Failed to refresh session");
      return false;
    } catch (error) {
      console.error("❌ Session refresh error:", error);
      return false;
    }
  };

  const value = {
    isAuthenticated,
    user,
    session,
    login,
    logout,
    refreshSession,
    isSessionExpiring,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export utility functions for use outside of React components
export { getSessionToken, getSessionUser, clearSession };