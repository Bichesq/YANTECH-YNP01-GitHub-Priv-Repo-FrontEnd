/**
 * Storage Utility Functions
 * Provides type-safe localStorage and sessionStorage operations
 * with error handling and JSON serialization
 */

export type StorageType = 'local' | 'session';

/**
 * Get the appropriate storage object based on type
 */
const getStorage = (type: StorageType): Storage | null => {
  if (typeof window === 'undefined') {
    return null; // SSR safety
  }
  return type === 'local' ? localStorage : sessionStorage;
};

/**
 * Store data in browser storage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @param type - Storage type ('local' or 'session')
 */
export const setStorageItem = <T>(
  key: string,
  value: T,
  type: StorageType = 'local'
): boolean => {
  try {
    const storage = getStorage(type);
    if (!storage) return false;

    const serializedValue = JSON.stringify(value);
    storage.setItem(key, serializedValue);
    return true;
  } catch (error) {
    console.error(`Error setting ${type}Storage item:`, error);
    return false;
  }
};

/**
 * Retrieve data from browser storage
 * @param key - Storage key
 * @param type - Storage type ('local' or 'session')
 * @returns Parsed value or null if not found/error
 */
export const getStorageItem = <T>(
  key: string,
  type: StorageType = 'local'
): T | null => {
  try {
    const storage = getStorage(type);
    if (!storage) return null;

    const item = storage.getItem(key);
    if (!item) return null;

    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error getting ${type}Storage item:`, error);
    return null;
  }
};

/**
 * Remove a specific item from browser storage
 * @param key - Storage key to remove
 * @param type - Storage type ('local' or 'session')
 */
export const removeStorageItem = (
  key: string,
  type: StorageType = 'local'
): boolean => {
  try {
    const storage = getStorage(type);
    if (!storage) return false;

    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${type}Storage item:`, error);
    return false;
  }
};

/**
 * Clear all items from browser storage
 * @param type - Storage type ('local' or 'session')
 */
export const clearStorage = (type: StorageType = 'local'): boolean => {
  try {
    const storage = getStorage(type);
    if (!storage) return false;

    storage.clear();
    return true;
  } catch (error) {
    console.error(`Error clearing ${type}Storage:`, error);
    return false;
  }
};

/**
 * Check if a storage key exists
 * @param key - Storage key to check
 * @param type - Storage type ('local' or 'session')
 */
export const hasStorageItem = (
  key: string,
  type: StorageType = 'local'
): boolean => {
  try {
    const storage = getStorage(type);
    if (!storage) return false;

    return storage.getItem(key) !== null;
  } catch (error) {
    console.error(`Error checking ${type}Storage item:`, error);
    return false;
  }
};

/**
 * Get all keys from storage
 * @param type - Storage type ('local' or 'session')
 */
export const getStorageKeys = (type: StorageType = 'local'): string[] => {
  try {
    const storage = getStorage(type);
    if (!storage) return [];

    return Object.keys(storage);
  } catch (error) {
    console.error(`Error getting ${type}Storage keys:`, error);
    return [];
  }
};

/**
 * Check if storage is available
 * @param type - Storage type to check
 */
export const isStorageAvailable = (type: StorageType = 'local'): boolean => {
  try {
    const storage = getStorage(type);
    if (!storage) return false;

    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

