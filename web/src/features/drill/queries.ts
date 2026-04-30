import { useMutation } from '@tanstack/react-query';
import type {
  EndSessionRequest,
  EndSessionResponse,
  JudgeRequest,
  JudgeResponse,
  SessionStartRequest,
  SessionStartResponse,
} from '@shared/dto';
import { apiRequest } from '../../lib/api-client';

export function useStartSessionMutation() {
  return useMutation({
    mutationFn: (request: SessionStartRequest) =>
      apiRequest<SessionStartResponse>('/api/sessions/start', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  });
}

export function useJudgeAnswerMutation() {
  return useMutation({
    mutationFn: (request: JudgeRequest) =>
      apiRequest<JudgeResponse>('/api/answers/judge', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  });
}

export function useEndSessionMutation() {
  return useMutation({
    mutationFn: (request: EndSessionRequest) =>
      apiRequest<EndSessionResponse>('/api/sessions/end', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
  });
}
