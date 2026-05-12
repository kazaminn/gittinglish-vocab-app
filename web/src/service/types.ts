import {
  type DrillMode,
  type DrillProgress,
  type GeneratedProblem,
  type Session,
  type UserSettings,
} from '@shared/domain';

// Auth

export interface User {
  id: string;
  displayName: string;
}

export interface AuthService {
  getCurrentUser(): User | undefined;
  onAuthStateChange(callback: (user: User | undefined) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

// Progress

export interface ProgressService {
  getProgress(userId: string, drillMode: DrillMode): Promise<DrillProgress[]>;
  saveProgress(progress: DrillProgress): Promise<void>;
  resetProgress(userId: string): Promise<void>;
}

// Session

export interface SessionStartParams {
  userId: string;
  drillMode: DrillMode;
  count: number;
}

export interface SessionService {
  startSession(
    params: SessionStartParams,
    problems: GeneratedProblem[],
    progressList: DrillProgress[]
  ): Promise<Session>;
  getActiveSession(userId: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  clearSession(userId: string): Promise<void>;
}

// Settings

export interface SettingsService {
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}
