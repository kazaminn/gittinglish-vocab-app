import { type AuthService, type User } from './types';

const MOCK_USER: User = {
  id: 'mock-user-001',
  displayName: 'User',
};

export function createMockAuthService(): AuthService {
  let user: User | undefined = MOCK_USER;
  const listeners = new Set<(u: User | undefined) => void>();

  return {
    getCurrentUser() {
      return user;
    },

    onAuthStateChange(callback: (u: User | undefined) => void): () => void {
      listeners.add(callback);
      // Immediately notify current state
      callback(user);
      return () => listeners.delete(callback);
    },

    signIn() {
      user = MOCK_USER;
      listeners.forEach((cb) => cb(user));
      return Promise.resolve();
    },

    signOut() {
      user = undefined;
      listeners.forEach((cb) => cb(user));
      return Promise.resolve();
    },
  };
}
