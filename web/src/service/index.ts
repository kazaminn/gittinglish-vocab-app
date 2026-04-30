import { type Services } from './context';
import { createLocalProgressService } from './progress.local';
import { createLocalSessionService } from './session.local';
import { createLocalSettingsService } from './settings.local';

export { ServiceProvider, useServices } from './context';
export type { Services } from './context';
export type {
  ProgressService,
  SessionService,
  SessionStartParams,
  SettingsService,
} from './types';

export function createDefaultServices(): Services {
  return {
    progress: createLocalProgressService(),
    session: createLocalSessionService(),
    settings: createLocalSettingsService(),
  };
}
