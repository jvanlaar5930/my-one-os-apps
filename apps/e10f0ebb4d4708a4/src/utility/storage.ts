import type { StoragePort } from '../types/recipe';

export const getStorage = (): StoragePort | null => {
  if (typeof window === 'undefined' || !window.os) return null;
  return {
    get: async key => {
      if (!window.os) throw new Error('Storage is unavailable.');
      return await window.os.storage.get(key);
    },
    set: async (key, value) => {
      if (!window.os) throw new Error('Storage is unavailable.');
      return await window.os.storage.set(key, value);
    },
  };
};
