/**
 * Session Manager Utility
 * Handles authentication session storage, validation, and expiration
 */

import { AuthSession, SessionData, User } from '@/types';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

// Storage keys
const SESSION_KEY = 'auth_session';
const SESSION_STORAGE_TYPE = 'local'; // Use 'local' for persistence across browser sessions

// Default session duration (24 hours in milliseconds)
const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Create a new authentication session
 * @param token - Authentication token
 * @param user - User information
 * @param expiresIn - Session duration in seconds (optional)
 * @param refreshToken - Refresh token (optional)
 */
export const createSession = (
  token: string,
  user: User,
  expiresIn?: number,
  refreshToken?: string
): AuthSession => {
  const now = Date.now();
  const duration = expiresIn ? expiresIn * 1000 : DEFAULT_SESSION_DURATION;
  
  const session: AuthSession = {
    token,
    user,
    issuedAt: now,
    expiresAt: now + duration,
    refreshToken,
  };

  return session;
};

/**
 * Save session to storage
 * @param session - Authentication session to save
 */
export const saveSession = (session: AuthSession): boolean => {
  return setStorageItem(SESSION_KEY, session, SESSION_STORAGE_TYPE);
};

/**
 * Get session from storage
 * @returns AuthSession or null if not found
 */
export const getSession = (): AuthSession | null => {
  return getStorageItem<AuthSession>(SESSION_KEY, SESSION_STORAGE_TYPE);
};

/**
 * Remove session from storage
 */
export const clearSession = (): boolean => {
  return removeStorageItem(SESSION_KEY, SESSION_STORAGE_TYPE);
};

/**
 * Check if a session is expired
 * @param session - Session to check
 * @returns true if expired, false otherwise
 */
export const isSessionExpired = (session: AuthSession): boolean => {
  return Date.now() >= session.expiresAt;
};

/**
 * Check if a session is valid (exists and not expired)
 * @param session - Session to validate
 * @returns true if valid, false otherwise
 */
export const isSessionValid = (session: AuthSession | null): boolean => {
  if (!session) return false;
  if (!session.token || !session.user) return false;
  return !isSessionExpired(session);
};

/**
 * Get session data with validation status
 * @returns SessionData object with session and validation info
 */
export const getSessionData = (): SessionData => {
  const session = getSession();
  
  if (!session) {
    return {
      session: null,
      isValid: false,
      isExpired: false,
    };
  }

  const expired = isSessionExpired(session);
  
  // Auto-cleanup expired sessions
  if (expired) {
    clearSession();
  }

  return {
    session: expired ? null : session,
    isValid: !expired,
    isExpired: expired,
  };
};

/**
 * Update session expiration time
 * @param additionalTime - Additional time in seconds to extend the session
 */
export const extendSession = (additionalTime?: number): boolean => {
  const session = getSession();
  if (!session || isSessionExpired(session)) {
    return false;
  }

  const extension = additionalTime ? additionalTime * 1000 : DEFAULT_SESSION_DURATION;
  session.expiresAt = Date.now() + extension;

  return saveSession(session);
};

/**
 * Update user information in the current session
 * @param user - Updated user information
 */
export const updateSessionUser = (user: Partial<User>): boolean => {
  const session = getSession();
  if (!session || isSessionExpired(session)) {
    return false;
  }

  session.user = { ...session.user, ...user };
  return saveSession(session);
};

/**
 * Get time remaining until session expires (in milliseconds)
 * @returns Time remaining or 0 if expired/invalid
 */
export const getSessionTimeRemaining = (): number => {
  const session = getSession();
  if (!session) return 0;

  const remaining = session.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Check if session will expire soon
 * @param thresholdMinutes - Minutes before expiration to consider "soon" (default: 5)
 * @returns true if session expires within threshold
 */
export const isSessionExpiringSoon = (thresholdMinutes: number = 5): boolean => {
  const remaining = getSessionTimeRemaining();
  const threshold = thresholdMinutes * 60 * 1000;
  return remaining > 0 && remaining <= threshold;
};

/**
 * Get session token
 * @returns Token string or null
 */
export const getSessionToken = (): string | null => {
  const session = getSession();
  return session?.token || null;
};

/**
 * Get current user from session
 * @returns User object or null
 */
export const getSessionUser = (): User | null => {
  const session = getSession();
  return session?.user || null;
};

