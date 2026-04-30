import { createContext, useContext } from 'react';
import {
  type ProgressService,
  type SessionService,
  type SettingsService,
} from './types';

export interface Services {
  progress: ProgressService;
  session: SessionService;
  settings: SettingsService;
}

const ServiceContext = createContext<Services | undefined>(undefined);

export const ServiceProvider = ServiceContext.Provider;

export function useServices(): Services {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error('useServices must be used within ServiceProvider');
  return ctx;
}
